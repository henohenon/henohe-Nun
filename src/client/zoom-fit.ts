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
 *
 * 計測には container の `scrollHeight` / `scrollWidth` を使う (= 自然 content
 * size、 margin / overflow 含む)。 旧実装の child.offsetTop+offsetHeight per
 * 集約方式は last child の margin-block-end が欠落する罠があった。
 */

const MAX_ITERATIONS = 10

const DEBUG = new URLSearchParams(location.search).has('debug')

interface FitLog {
  slideId: string
  iter: number
  offsetW: number
  offsetH: number
  scrollW: number
  scrollH: number
  scale: number
  zoom: number
}
const fitLogs: FitLog[] = []

function logFit(entry: FitLog): void {
  fitLogs.push(entry)
  if (DEBUG) {
    console.log(
      `[zoom-fit] slide=${entry.slideId} iter=${entry.iter} ` +
      `offset=${entry.offsetW.toFixed(1)}x${entry.offsetH.toFixed(1)} ` +
      `scroll=${entry.scrollW.toFixed(1)}x${entry.scrollH.toFixed(1)} ` +
      `scale=${entry.scale.toFixed(3)} → zoom=${entry.zoom.toFixed(3)}`,
    )
    renderDebugOverlay()
  }
}

function renderDebugOverlay(): void {
  let overlay = document.getElementById('__zoom-fit-debug')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = '__zoom-fit-debug'
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#0f0;font:11px/1.3 monospace;padding:4px 6px;z-index:99999;pointer-events:none;white-space:pre;max-height:50vh;overflow:hidden;'
    document.body.appendChild(overlay)
  }
  // Show last 12 entries (most recent on top)
  const lines = fitLogs.slice(-12).map(e =>
    `s${e.slideId} i${e.iter} off:${e.offsetW.toFixed(0)}x${e.offsetH.toFixed(0)} scr:${e.scrollW.toFixed(0)}x${e.scrollH.toFixed(0)} sc:${e.scale.toFixed(3)} z:${e.zoom.toFixed(3)}`,
  )
  overlay.textContent = lines.join('\n')
}

function adjustZoom(
  container: HTMLElement,
  iteration: number,
  currentZoom: number,
  slideId: string,
): void {
  if (iteration >= MAX_ITERATIONS) return
  const offsetW = container.offsetWidth
  const offsetH = container.offsetHeight
  const naturalW = container.scrollWidth
  const naturalH = container.scrollHeight
  if (naturalW === 0 || naturalH === 0) return
  const sx = offsetW / naturalW
  const sy = offsetH / naturalH
  const scale = Math.min(sx, sy)
  logFit({ slideId, iter: iteration, offsetW, offsetH, scrollW: naturalW, scrollH: naturalH, scale, zoom: currentZoom })
  if (scale >= 1 && currentZoom >= 1) return
  const newZoom = currentZoom * scale
  container.style.zoom = String(newZoom)
  adjustZoom(container, iteration + 1, newZoom, slideId)
}

/** slide の `.content` (stage 直下) を必要に応じて zoom 縮小して、 はみ出しを抑える。 */
export function fitSlide(slide: HTMLElement): void {
  const slideId = slide.id || '?'
  for (const content of slide.querySelectorAll<HTMLElement>(':scope > .stage > .content')) {
    if (content.children.length === 0) continue
    content.style.zoom = ''
    adjustZoom(content, 0, 1, slideId)
  }
}
