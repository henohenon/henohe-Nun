import { raw } from 'hono/html';
import { diffLines, escapeHtml, highlightCode, parseCodeLang, splitHighlightedLines } from '../../parser/markdown/code';

export function codeToHtml(text: string, lang: string): string {
  const { base, isDiff, filename, startLine } = parseCodeLang(lang);
  const labelClass = filename ? 'code-filename' : 'code-lang';
  const label = filename || base || '';

  let bodyHtml: string;
  let hasLineNumbers = false;
  if (startLine !== undefined) {
    const lines = isDiff
      ? diffLines(text, base)
      : splitHighlightedLines(highlightCode(text, base)).map((l) => `<span class="ln-body">${l}</span>`);
    bodyHtml = lines.map((l, i) => `<span class="ln">${startLine + i}</span>${l}`).join('');
    hasLineNumbers = true;
  } else if (isDiff) {
    bodyHtml = diffLines(text, base).join('');
  } else {
    bodyHtml = highlightCode(text, base);
  }

  const source = escapeHtml(text);

  const block = (
    <div class="code-block">
      <div class="code-header">
        <span class={labelClass}>{label}</span>
        <button
          class="copy-btn"
          onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').dataset.source)"
        >
          Copy
        </button>
      </div>
      <pre class={hasLineNumbers ? 'line-numbers' : undefined}>
        <code data-source={source}>{raw(bodyHtml)}</code>
      </pre>
    </div>
  );

  return block.toString();
}
