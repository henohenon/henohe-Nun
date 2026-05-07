/**
 * favicon を 4 フレームでループアニメーションさせる (wave01 → wave02 → wave03 → wave04 → ...)。
 *
 * **canvas + data URL 戦略**:
 * `<link rel="icon" href="...">` の href を file URL のまま差し替えると、 Chrome /
 * Safari 等のブラウザが tab favicon UI を即更新しないケースがある (内部 cache /
 * favicon resolution の優先度問題)。 canvas で 4 frame を 1 度デコード → tick
 * ごとに該当 frame を canvas に再描画 → `canvas.toDataURL()` で frame ごとに
 * 別の data URL を生成 → link.href に代入。 brand-new URL なので browser は
 * 確実に新規 favicon として処理する。
 *
 * 動作仕様:
 * - SSG 側で `<link rel="icon" type="image/png" data-anim href=".../wave01.png">` を
 *   埋め込むこと前提。 base prefix (Vite) も SSG で解決済みになる
 * - 起動時に上記 link から base ディレクトリを抽出し、 wave01〜04 の URL を派生
 * - 全 frame を `Image()` でロードし、 onload 完了後にアニメ開始
 * - フレーム間隔は `FRAME_INTERVAL_MS` 定数で制御
 * - tab が hidden になったら interval を止め、 戻ったら再開 (CPU / battery 配慮)
 *
 * ICO fallback link (`<link rel="icon" href=".../favicon.ico">`) は残置されるので、
 * JS が動かない / canvas 不可能な環境では static favicon が出る。
 */

const FRAMES = ['wave01.png', 'wave02.png', 'wave03.png', 'wave04.png']
const FRAME_INTERVAL_MS = 500
const ICON_SIZE = 32
const ANIM_LINK_SELECTOR = 'link[rel="icon"][data-anim]'

export function initFaviconAnimation(): void {
  const initial = document.querySelector<HTMLLinkElement>(ANIM_LINK_SELECTOR)
  if (!initial) return

  // base から各 frame の絶対 URL を派生
  const baseUrl = new URL(initial.href, document.baseURI)
  const dir = baseUrl.pathname.replace(/[^/]+$/, '')
  const urls = FRAMES.map(name => `${baseUrl.origin}${dir}${name}`)

  // canvas を 1 つ確保 (32x32、 wave PNG と同寸)。 frame ごとに使い回し。
  const canvas = document.createElement('canvas')
  canvas.width = ICON_SIZE
  canvas.height = ICON_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 全 frame をプリロード。 onload を Promise 化して、 全部揃うまでアニメ開始を待つ。
  const images = urls.map(url => {
    const img = new Image()
    img.src = url
    return img
  })

  Promise.all(images.map(loadImage)).then(() => {
    let frame = 0
    let timer: number | null = null

    const tick = () => {
      frame = (frame + 1) % images.length
      ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
      ctx.drawImage(images[frame], 0, 0, ICON_SIZE, ICON_SIZE)
      initial.href = canvas.toDataURL('image/png')
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

    // 初期 frame として canvas に wave01 を描いて data URL 化、 link.href を
    // 上書きする (これも HTTP 経由 PNG 表示から canvas 製 data URL 表示に
    // 切り替えるため、 アニメ初回 tick より前にやる)。
    ctx.drawImage(images[0], 0, 0, ICON_SIZE, ICON_SIZE)
    initial.href = canvas.toDataURL('image/png')

    if (!document.hidden) start()
  })
}

function loadImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise(resolve => {
    img.addEventListener('load', () => resolve(), { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
  })
}
