/**
 * code-block の `<button class="copy">` クリックで code 内容を clipboard に転送。
 *
 * delegated click で `figure.code-block button.copy` 全部をひとつの listener で
 * 拾う。 ボタンラベルは一時的に "copied" に変えて 1.5 秒後に元に戻す。
 */

const COPIED_FEEDBACK_MS = 1500

export function initCopyButtons(): void {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('button.copy')
    if (!btn) return
    const figure = btn.closest('figure.code-block')
    const code = figure?.querySelector('code') as HTMLElement | null
    if (!code) return

    try {
      await navigator.clipboard.writeText(extractCleanCode(code))
      const original = btn.textContent
      btn.textContent = 'copied'
      setTimeout(() => { btn.textContent = original }, COPIED_FEEDBACK_MS)
    } catch {
      // Clipboard API not available
    }
  })
}

/** code 要素から clipboard 用のクリーンなテキストを抽出。
 *  - 各 `.line` を改行で連結 (diff の `\n` text node 除去で textContent が
 *    一行に潰れる問題を回避)
 *  - `.line-number` (装飾用 prepend) は除外
 *  - `.line` が存在しない (= shiki 未通過) ケースでは textContent にフォールバック */
function extractCleanCode(code: HTMLElement): string {
  const lines = code.querySelectorAll<HTMLElement>(':scope > .line')
  if (lines.length === 0) return code.textContent ?? ''

  const out: string[] = []
  for (const line of lines) {
    const clone = line.cloneNode(true) as HTMLElement
    for (const ln of clone.querySelectorAll('.line-number, .diff-marker')) ln.remove()
    out.push(clone.textContent ?? '')
  }
  return out.join('\n')
}
