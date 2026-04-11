import hljs from 'highlight.js';
import { Marked } from 'marked';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Fenced code lang is parsed in the form
//   [diff_]<lang>[:filename][#L<start>[-L<end>]]
// Examples: `js`, `diff_js`, `js:sample.js`, `js:sample.js#L10-L20`, `diff_ts#L42`.
type CodeLang = {
  base: string;          // highlight.js language id; '' means no explicit lang
  isDiff: boolean;       // render `+`/`-` lines with diff background
  filename?: string;     // shown in the header instead of the lang label
  startLine?: number;    // first displayed line number (enables line numbering)
};

function parseCodeLang(raw: string): CodeLang {
  let s = raw.trim();
  let startLine: number | undefined;
  const ln = /#L(\d+)(?:-L\d+)?$/.exec(s);
  if (ln) {
    startLine = Number(ln[1]);
    s = s.slice(0, ln.index);
  }
  let filename: string | undefined;
  const colon = s.indexOf(':');
  if (colon !== -1) {
    filename = s.slice(colon + 1);
    s = s.slice(0, colon);
  }
  let isDiff = false;
  let base = s;
  if (s === 'diff') {
    isDiff = true;
    base = '';
  } else if (s.startsWith('diff_')) {
    isDiff = true;
    base = s.slice(5);
  }
  return { base, isDiff, filename, startLine };
}

function highlightCode(code: string, base: string): string {
  if (base && hljs.getLanguage(base)) {
    return hljs.highlight(code, { language: base }).value;
  }
  return hljs.highlightAuto(code).value;
}

// Render diff-style code: each line prefixed with `+` / `-` / ` ` gets wrapped
// so CSS can paint row backgrounds. The marker is stripped before syntax
// highlighting so tokens stay accurate. Returns an array so the caller can
// join without inserting `\n` — block-display spans inside a `<pre>` must not
// have whitespace between them or it renders as an extra blank line.
function diffLines(code: string, base: string): string[] {
  return code.split('\n').map((line) => {
    const first = line[0];
    let cls = '';
    let body = line;
    let sign = '';
    if (first === '+') {
      cls = ' diff-add';
      body = line.slice(1);
      sign = '+';
    } else if (first === '-') {
      cls = ' diff-del';
      body = line.slice(1);
      sign = '-';
    }
    const hl = body.length ? highlightCode(body, base) : '';
    return `<span class="diff-line${cls}">${sign}${hl}</span>`;
  });
}

// Split highlighted HTML into per-line chunks, preserving hljs span nesting by
// closing any open spans at line end and reopening them on the next line.
function splitHighlightedLines(html: string): string[] {
  const out: string[] = [];
  const stack: string[] = [];
  let buf = '';
  let i = 0;
  while (i < html.length) {
    const ch = html[i];
    if (ch === '\n') {
      out.push(buf + '</span>'.repeat(stack.length));
      buf = stack.join('');
      i++;
      continue;
    }
    if (ch === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        buf += html.slice(i);
        break;
      }
      const tag = html.slice(i, end + 1);
      if (tag.startsWith('<span')) stack.push(tag);
      else if (tag === '</span>' && stack.length) stack.pop();
      buf += tag;
      i = end + 1;
      continue;
    }
    buf += ch;
    i++;
  }
  out.push(buf + '</span>'.repeat(stack.length));
  return out;
}

const marked = new Marked(
  { gfm: true, breaks: true },
  {
    renderer: {
      code({ text, lang }) {
        const { base, isDiff, filename, startLine } = parseCodeLang(lang ?? '');
        const label = filename || base || '';

        let body: string;
        let preClass = '';
        if (startLine !== undefined) {
          // Line-number mode: render `<code>` as a 2-column grid (`auto 1fr`)
          // with an `.ln` cell and a body cell per line. Grid auto-sizes the
          // gutter to the widest number, so there's no digit math anywhere.
          const lines = isDiff
            ? diffLines(text, base)
            : splitHighlightedLines(highlightCode(text, base)).map(
                (l) => `<span class="ln-body">${l}</span>`,
              );
          body = lines
            .map((l, i) => `<span class="ln">${startLine + i}</span>${l}`)
            .join('');
          preClass = ' class="line-numbers"';
        } else if (isDiff) {
          // No gutter — block-display `.diff-line` spans stack directly.
          body = diffLines(text, base).join('');
        } else {
          body = highlightCode(text, base);
        }

        // Raw source goes on a data attribute so the copy button doesn't
        // have to navigate around line-number cells or diff markers.
        const source = escapeHtml(text);

        return [
          '<div class="code-block">',
          '<div class="code-header">',
          `<span class="code-lang">${escapeHtml(label)}</span>`,
          `<button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').dataset.source)">Copy</button>`,
          '</div>',
          `<pre${preClass}><code data-source="${source}">${body}</code></pre>`,
          '</div>',
        ].join('');
      },
    },
  },
);

export function renderMarkdown(text: string): string {
  const result = marked.parse(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parse');
  return result;
}

export function renderInline(text: string): string {
  const result = marked.parseInline(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parseInline');
  return result;
}

// Stateful code-fence tracker shared by parser.ts and markup.ts. Call the
// returned function once per line in order; it reports whether the line is
// inside a fenced code block and whether it is itself a fence boundary
// (opening or closing ``` / ~~~). Callers should skip directive/meta
// processing for lines where `inFence || isBoundary`.
export function createFenceTracker(): (line: string) => { inFence: boolean; isBoundary: boolean } {
  let marker = '';
  return (line: string) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    const wasInside = marker !== '';
    if (m) {
      const found = m[1];
      if (!wasInside) {
        marker = found;
        return { inFence: false, isBoundary: true };
      }
      if (found[0] === marker[0] && found.length >= marker.length) {
        marker = '';
        return { inFence: true, isBoundary: true };
      }
    }
    return { inFence: wasInside, isBoundary: false };
  };
}
