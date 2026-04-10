import hljs from 'highlight.js';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const marked = new Marked(
  { gfm: true, breaks: false },
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  }),
  {
    renderer: {
      code({ text, lang }) {
        const label = lang ?? '';
        return [
          '<div class="code-block">',
          '<div class="code-header">',
          `<span class="code-lang">${escapeHtml(label)}</span>`,
          `<button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent)">Copy</button>`,
          '</div>',
          `<pre><code>${text}</code></pre>`,
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
