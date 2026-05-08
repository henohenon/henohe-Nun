import 'virtual:uno.css'
import '../styles/index.css'

import { initNavigation } from './navigation.ts'
import { initCopyButtons } from './copy.ts'
import { initFnTooltips } from './tooltip.ts'
import { initFaviconAnimation } from './favicon-anim.ts'
import { initCursorJack } from './cursor-jack.ts'

// `?theme=dark` 等の URL query で data-theme を root に流し込む。 capture や
// preview の入口、 deploy 済みサイトでも dark を URL だけで見るための入口。
// 値の妥当性チェックはせず素通し (CSS 側で対応する theme 名のみ反応)、 未指定時
// は何もしないので default (light) になる。
const themeParam = new URLSearchParams(location.search).get('theme')
if (themeParam) {
  document.documentElement.setAttribute('data-theme', themeParam)
}

const sections = document.querySelectorAll<HTMLElement>('section')
if (sections.length > 0) {
  // Navigation は内部で showSlide → fitSlide を呼ぶので、
  // zoom-fit は init 不要 (fitSlide は navigation / resize / print 経由で叩かれる)。
  initNavigation(sections)
  initCopyButtons()
  initFnTooltips()
  initCursorJack()
}

initFaviconAnimation()

// Mermaid は build 時に `scripts/render-mermaid.ts` で SVG に静的化済みのため
// client-side では何もしない。capture スクリプト用の互換性のため、
// `mermaidReady` データ属性は HTML 解析直後 (このファイルが評価された時点)
// に立てておく。
document.documentElement.dataset.mermaidReady = ''
