/**
 * fbg mask の `<use>` 要素を section の最終行 (footer 位置) に shift する。
 *
 * 元設計: SVG `<use href="#footer-shape">` に CSS `y: calc(100% - var(...))` で
 * mask cutout を section 下端の footer 位置に shift。
 * → iOS Safari の SVG attribute / CSS の calc + var の評価が安定せず、
 *   `<use y="calc(100% - var(--footer-line-height) - var(--footer-font-size))">`
 *   や CSS rule どちらも iPhone Chrome (= WebKit) で適用されない。
 * → 実行時に section と footer の実 height を測って use の y attribute に
 *   絶対 px 値を流し込む実装に切替。 iOS / Chrome / Safari 全 engine で
 *   引っかからない素朴な layout 計測 route。
 *
 * resize にも追従する (window resize で再計算)。
 */

function applyFbgMaskOffset(section: HTMLElement): void {
  const use = section.querySelector<SVGUseElement>('.fbg-svg > mask > use')
  if (!use) return
  const footer = section.querySelector<HTMLElement>(':scope > footer')
  if (!footer) return
  const sectionHeight = section.offsetHeight
  const footerHeight = footer.offsetHeight
  const y = sectionHeight - footerHeight
  use.setAttribute('y', String(y))
}

function applyAll(): void {
  for (const section of document.querySelectorAll<HTMLElement>('section')) {
    applyFbgMaskOffset(section)
  }
}

/** fbg mask の y offset を初期化 + resize 時の再計算を登録する。 */
export function initFbgMask(): void {
  applyAll()
  window.addEventListener('resize', applyAll)
}
