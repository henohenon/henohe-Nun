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

const IMAGE_EXT = /\.(png|jpe?g|svg|gif|webp|avif)$/i;

function preprocessMd(text: string): string {
  return text.replace(/(?<!!)\[([^\]]+)\](?!\()/g, (_, content: string) => {
    const trimmed = content.trim();
    if (IMAGE_EXT.test(trimmed)) {
      return `![](${trimmed})`;
    }
    if (/^https?:\/\//.test(trimmed)) {
      return `[${trimmed}](${trimmed})`;
    }
    return `[${content}]`;
  });
}

export function renderMarkdown(text: string): string {
  const result = marked.parse(preprocessMd(text));
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parse');
  return result;
}

export function renderInline(text: string): string {
  const result = marked.parseInline(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parseInline');
  return result;
}
