/**
 * favicon を 4 フレームでループアニメーションさせる (wave01 → wave02 → wave03 → wave04 → ...)。
 *
 * 動作仕様:
 * - SSG 側で `<link rel="icon" type="image/png" data-anim href=".../wave01.png">` を埋め込む
 *   こと前提。 base prefix (Vite) も SSG で解決済みになる
 * - 起動時に上記 link から base ディレクトリを抽出し、 wave01〜04 の URL を派生
 * - フレーム間隔は `FRAME_INTERVAL_MS` 定数で制御。 4 frame × 250ms = 1 秒で 1 周
 * - 同時に 4 frame を `Image()` でプリロードして 1 周目から滑らかに切り替わるようにする
 * - tab が hidden になったら interval を止め、 戻ったら再開 (CPU / battery 配慮)
 *
 * Safari 等で `<link>` の href 更新が favicon 反映に渋いケースがあるため、
 * tick ごとに既存 link を remove して新規 link を append する replace 方式で
 * cross-browser 互換を取る。 ICO fallback link (`<link rel="icon" sizes="any">`) は
 * 残置されるので動かないブラウザでも static favicon が出る。
 */

const FRAMES = ['wave01.png', 'wave02.png', 'wave03.png', 'wave04.png']
const FRAME_INTERVAL_MS = 500
const ANIM_LINK_SELECTOR = 'link[rel="icon"][data-anim]'

export function initFaviconAnimation(): void {
  const initial = document.querySelector<HTMLLinkElement>(ANIM_LINK_SELECTOR)
  if (!initial) return

  // base から各 frame の絶対 URL を派生
  const baseUrl = new URL(initial.href, document.baseURI)
  const dir = baseUrl.pathname.replace(/[^/]+$/, '')
  const urls = FRAMES.map(name => `${baseUrl.origin}${dir}${name}`)

  // 全 frame をプリロード (32x32 PNG なので合計でも 10KB 未満)
  for (const url of urls) {
    const img = new Image()
    img.src = url
  }

  let frame = 0
  let timer: number | null = null

  const tick = () => {
    frame = (frame + 1) % urls.length
    swapAnimLink(urls[frame])
  }

  const start = () => {
    if (timer != null) return
    timer = window.setInterval(tick, FRAME_INTERVAL_MS)
  }
  const stop = () => {
    if (timer == null) return
    window.clearInterval(timer)
    timer = null
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else start()
  })

  if (!document.hidden) start()
}

/** 既存の data-anim icon link を remove して新規 link で置換する。
 *  href の単純更新では一部 browser (Safari 等) で再フェッチが走らないため。 */
function swapAnimLink(href: string): void {
  for (const old of document.querySelectorAll<HTMLLinkElement>(ANIM_LINK_SELECTOR)) {
    old.remove()
  }
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.dataset.anim = ''
  link.href = href
  document.head.appendChild(link)
}
