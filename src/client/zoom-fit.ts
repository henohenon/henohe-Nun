/**
 * slide 内の `.content` がコンテナ高さを超える場合、 CSS `transform: scale()`
 * で縮小して fit させる。
 *
 * **縦オーバー支配時 (sy < sx) は logical width を visualW/sy へ拡張してから
 * scale(sy) を当てる**ことで、 reflow 後の見た目を画面横幅いっぱいに張る
 * (均等 scale だと縦に合わせた瞬間に横が縮んで余白が出てしまう)。
 * 横オーバー支配時 (sx ≤ sy) は素の min(sx, sy) を適用 (logical width は
 * 弄らず、 元の container 領域基準のまま scale で吸収)。
 *
 * visual 領域 (= parent が割り当てた container 幅 / 高さ) は iter 0 で 1 回
 * キャプチャして使い回す。 explicit width を当てた後の `container.offsetWidth`
 * は visual ではなく logical (こちらが設定した値) になるため再計測してはいけない。
 *
 * transform は layout に影響しないが、 logical width の変更は reflow を引き起こす
 * (text wrap が変わる) ため scrollHeight が iter ごとに変わりうる。 MAX_ITERATIONS
 * + CONVERGE_EPSILON で安全に収束させる。
 *
 * stage refactor 後: location は `section > .stage > .content`
 * (default/compare/message/title/solo)、 me は `section > .stage > .container > .content`。
 * fit は section 直下 stage 経由の content (`:scope > .stage > .content`) のみ対象とし、
 * me 等の nested .content は親 stage 側の transform が伝播することで間接的に
 * スケールされる。
 *
 * 計測には container の `scrollHeight` / `scrollWidth` を使う (= 自然 content
 * size、 margin / overflow 含む)。 旧実装の child.offsetTop+offsetHeight per
 * 集約方式は last child の margin-block-end が欠落する罠があった。
 *
 * transform-origin は `top left` 固定: top-left を layout box に揃えると、
 * scale 後のコンテンツが container の (0,0) 起点で predictable に配置される。
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
  applied: number
}
const fitLogs: FitLog[] = []

function logFit(entry: FitLog): void {
  fitLogs.push(entry)
  if (DEBUG) {
    console.log(
      `[zoom-fit] slide=${entry.slideId} iter=${entry.iter} ` +
      `offset=${entry.offsetW.toFixed(1)}x${entry.offsetH.toFixed(1)} ` +
      `scroll=${entry.scrollW.toFixed(1)}x${entry.scrollH.toFixed(1)} ` +
      `scale=${entry.scale.toFixed(3)} → applied=${entry.applied.toFixed(3)}`,
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
    `s${e.slideId} i${e.iter} off:${e.offsetW.toFixed(0)}x${e.offsetH.toFixed(0)} scr:${e.scrollW.toFixed(0)}x${e.scrollH.toFixed(0)} sc:${e.scale.toFixed(3)} a:${e.applied.toFixed(3)}`,
  )
  overlay.textContent = lines.join('\n')
}

const CONVERGE_EPSILON = 0.001

function adjustScale(
  container: HTMLElement,
  visualW: number,
  visualH: number,
  iteration: number,
  currentScale: number,
  slideId: string,
): void {
  if (iteration >= MAX_ITERATIONS) return
  const naturalW = container.scrollWidth
  const naturalH = container.scrollHeight
  if (naturalW === 0 || naturalH === 0) return
  const sx = visualW / naturalW
  const sy = visualH / naturalH
  const scale = Math.min(sx, sy)
  logFit({ slideId, iter: iteration, offsetW: visualW, offsetH: visualH, scrollW: naturalW, scrollH: naturalH, scale, applied: currentScale })
  if (scale >= 1) {
    container.style.transform = ''
    container.style.width = ''
    return
  }
  if (Math.abs(scale - currentScale) < CONVERGE_EPSILON) return
  // 縦オーバー支配: logical width を visualW/scale に拡張、 scale(sy) で視覚的に visualW に戻す
  // 横オーバー支配: 横が min-content で詰まってる状況、 width 拡張は無効なので scale 一発
  if (sy < sx) {
    container.style.width = `${visualW / scale}px`
  } else {
    container.style.width = ''
  }
  container.style.transform = `scale(${scale})`
  container.style.transformOrigin = 'top left'
  adjustScale(container, visualW, visualH, iteration + 1, scale, slideId)
}

/** slide の `.content` (stage 直下) を必要に応じて transform: scale で縮小して、 はみ出しを抑える。 */
export function fitSlide(slide: HTMLElement): void {
  const slideId = slide.id || '?'
  for (const content of slide.querySelectorAll<HTMLElement>(':scope > .stage > .content')) {
    if (content.children.length === 0) continue
    // 前回適用された transform/width をリセットしてから visual 領域を計測
    content.style.transform = ''
    content.style.transformOrigin = ''
    content.style.width = ''
    const visualW = content.offsetWidth
    const visualH = content.offsetHeight
    if (visualW === 0 || visualH === 0) continue
    adjustScale(content, visualW, visualH, 0, 1, slideId)
  }
}
