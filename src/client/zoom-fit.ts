/**
 * slide 内の `.content` がコンテナ高さを超える場合、 CSS `zoom` で縮小して fit させる。
 *
 * spec structure.md:87 通り、 zoom 反映後の再 layout を最大 10 回繰り返して
 * 収束を試みる (CSS zoom は子のサイズも変えるので 1 回では収まらないことがある)。
 * 収束しない場合は最後の値で確定する。
 *
 * stage refactor 後: 旧 `.body` は `.content` に rename、 location は
 * `section > .stage > .content` (default/compare/message/title/solo)、
 * me は `section > .stage > .container > .content`。 zoom-fit は section
 * 直下 stage 経由の content (`:scope > .stage > .content`) のみ対象とし、
 * me 等の nested .content は親 stage 側の zoom が伝播することで間接的に
 * スケールされる。 nested .content への直接 zoom はチェーン重複で潰れる。
 */

const MAX_ITERATIONS = 10

function adjustZoom(
  container: HTMLElement,
  children: HTMLElement[],
  iteration: number,
  currentZoom: number,
): void {
  if (iteration >= MAX_ITERATIONS) return
  const csx = Math.max(
    ...children.map(c => c.offsetLeft + c.offsetWidth - container.offsetLeft), 0,
  )
  const csy = Math.max(
    ...children.map(c => c.offsetTop + c.offsetHeight - container.offsetTop), 0,
  )
  if (csx === 0 || csy === 0) return
  const sx = container.offsetWidth / csx
  const sy = container.offsetHeight / csy
  const scale = Math.min(sx, sy)
  if (scale >= 1 && currentZoom >= 1) return
  const newZoom = currentZoom * scale
  container.style.zoom = String(newZoom)
  adjustZoom(container, children, iteration + 1, newZoom)
}

/** slide の `.content` (stage 直下) を必要に応じて zoom 縮小して、 はみ出しを抑える。 */
export function fitSlide(slide: HTMLElement): void {
  for (const content of slide.querySelectorAll<HTMLElement>(':scope > .stage > .content')) {
    const children = Array.from(content.children) as HTMLElement[]
    if (children.length === 0) continue
    content.style.zoom = ''
    adjustZoom(content, children, 0, 1)
  }
}
