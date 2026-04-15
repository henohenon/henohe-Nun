import { Marked } from 'marked';
import type { OgpData } from '../ogp-fetch';
import { diffLines, escapeHtml, highlightCode, parseCodeLang, splitHighlightedLines } from './code';
import { linkCardExtension, spacerExtension } from './extensions';

export { createFenceTracker } from './fence';

function createMarked(ogpMap: Map<string, OgpData | null>): Marked {
  return new Marked(
    { gfm: true, breaks: true },
    {
      extensions: [spacerExtension(), linkCardExtension(ogpMap)],
      renderer: {
        code({ text, lang }) {
          const { base, isDiff, filename, startLine } = parseCodeLang(lang ?? '');
          const labelClass = filename ? 'code-filename' : 'code-lang';
          const label = filename || base || '';

          let body: string;
          let preClass = '';
          if (startLine !== undefined) {
            const lines = isDiff
              ? diffLines(text, base)
              : splitHighlightedLines(highlightCode(text, base)).map((l) => `<span class="ln-body">${l}</span>`);
            body = lines.map((l, i) => `<span class="ln">${startLine + i}</span>${l}`).join('');
            preClass = ' class="line-numbers"';
          } else if (isDiff) {
            body = diffLines(text, base).join('');
          } else {
            body = highlightCode(text, base);
          }

          const source = escapeHtml(text);

          return [
            '<div class="code-block">',
            '<div class="code-header">',
            `<span class="${labelClass}">${escapeHtml(label)}</span>`,
            `<button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').dataset.source)">Copy</button>`,
            '</div>',
            `<pre${preClass}><code data-source="${source}">${body}</code></pre>`,
            '</div>',
          ].join('');
        },
      },
    },
  );
}

/** Render markdown with a pre-configured marked instance */
export function renderMarkdown(text: string, ogpMap: Map<string, OgpData | null>): string {
  const marked = createMarked(ogpMap);
  const result = marked.parse(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parse');
  return result;
}

export function renderInline(text: string): string {
  const marked = createMarked(new Map());
  const result = marked.parseInline(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parseInline');
  return result;
}
