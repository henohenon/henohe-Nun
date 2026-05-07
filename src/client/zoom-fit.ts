/**
 * slide 内の `.body` がコンテナ高さを超える場合、 CSS `zoom` で縮小して fit させる。
 *
 * spec structure.md:87 通り、 zoom 反映後の再 layout を最大 10 回繰り返して
 * 収束を試みる (CSS zoom は子のサイズも変えるので 1 回では収まらないことがある)。
 * 収束しない場合は最後の値で確定する。
 */

const MAX_ITERATIONS = 10

function adjustZoom(
  body: HTMLElement,
  children: HTMLElement[],
  iteration: number,
  currentZoom: number,
): void {
  if (iteration >= MAX_ITERATIONS) return
  const csx = Math.max(
    ...children.map(c => c.offsetLeft + c.offsetWidth - body.offsetLeft), 0,
  )
  const csy = Math.max(
    ...children.map(c => c.offsetTop + c.offsetHeight - body.offsetTop), 0,
  )
  if (csx === 0 || csy === 0) return
  const sx = body.offsetWidth / csx
  const sy = body.offsetHeight / csy
  const scale = Math.min(sx, sy)
  if (scale >= 1 && currentZoom >= 1) return
  const newZoom = currentZoom * scale
  body.style.zoom = String(newZoom)
  adjustZoom(body, children, iteration + 1, newZoom)
}

/** slide の `.body` を必要に応じて zoom 縮小して、 はみ出しを抑える。 */
export function fitSlide(slide: HTMLElement): void {
  for (const body of slide.querySelectorAll<HTMLElement>(':scope > .body')) {
    const children = Array.from(body.children) as HTMLElement[]
    if (children.length === 0) continue
    body.style.zoom = ''
    adjustZoom(body, children, 0, 1)
  }
}
