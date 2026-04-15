import hljs from 'highlight.js';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type CodeLang = {
  base: string;
  isDiff: boolean;
  filename?: string;
  startLine?: number;
};

export function parseCodeLang(raw: string): CodeLang {
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

export function highlightCode(code: string, base: string): string {
  if (base && hljs.getLanguage(base)) {
    return hljs.highlight(code, { language: base }).value;
  }
  return hljs.highlightAuto(code).value;
}

export function diffLines(code: string, base: string): string[] {
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

export function splitHighlightedLines(html: string): string[] {
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
