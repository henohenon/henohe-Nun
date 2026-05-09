import { fitSlide } from './zoom-fit.ts'

/** 次スライド (右 / 下 / space / 右手側 vim) へのナビゲーションキー */
const FORWARD_KEYS = new Set(['ArrowRight', 'ArrowDown', ' ', 'd', 's'])
/** 前スライド (左 / 上 / 左手側 vim) へのナビゲーションキー */
const BACKWARD_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'a', 'w'])

const SWIPE_THRESHOLD_PX = 50
const WHEEL_THRESHOLD_PX = 30
const WHEEL_DEBOUNCE_MS = 300

/**
 * スライドナビゲーションを初期化する。
 *
 * - hash (#N) で page index 管理。 view transition があれば使う
 * - キーボード / タッチスワイプ / マウスホイール / フルスクリーンクリック
 * - resize / beforeprint で fit を再実行
 */
export function initNavigation(sections: NodeListOf<HTMLElement>): void {
  function currentPage(): number {
    const hash = location.hash.replace('#', '')
    return hash ? parseInt(hash, 10) : 1
  }

  function showSlide(page: number) {
    const go = () => {
      sections.forEach((section, i) => {
        section.classList.toggle('active', i + 1 === page)
      })
      fitSlide(sections[page - 1])
    }

    if (document.startViewTransition) {
      document.startViewTransition(go)
    } else {
      go()
    }
  }

  function navigate(delta: number) {
    const current = currentPage()
    const next = current + delta
    if (next >= 1 && next <= sections.length) {
      location.hash = `#${next}`
    }
  }

  // Initial display
  showSlide(currentPage())
  window.addEventListener('hashchange', () => showSlide(currentPage()))

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement
    if (active instanceof HTMLElement) {
      const tag = active.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) return
    }

    if (FORWARD_KEYS.has(e.key)) {
      e.preventDefault()
      navigate(1)
    } else if (BACKWARD_KEYS.has(e.key)) {
      e.preventDefault()
      navigate(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      location.hash = '#1'
    } else if (e.key === 'End') {
      e.preventDefault()
      location.hash = `#${sections.length}`
    } else if (e.key === 'Enter') {
      // Enter で全画面トグル (presenter 操作の最頻出 1 キー)
      e.preventDefault()
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
    }
  })

  // Touch swipe
  let touchStartX = 0
  let touchStartY = 0
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }, { passive: true })

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      navigate(dx < 0 ? 1 : -1)
    }
  }, { passive: true })

  // Mouse wheel
  let wheelDebounce = false
  document.addEventListener('wheel', (e) => {
    if (wheelDebounce) return
    if (Math.abs(e.deltaY) > WHEEL_THRESHOLD_PX) {
      navigate(e.deltaY > 0 ? 1 : -1)
      wheelDebounce = true
      setTimeout(() => { wheelDebounce = false }, WHEEL_DEBOUNCE_MS)
    }
  }, { passive: true })

  // Fullscreen click: 左半分 → 戻る、 右半分 → 進む。 中点はビューポート幅基準
  document.addEventListener('click', (e) => {
    if (!document.fullscreenElement) return
    const target = e.target as HTMLElement
    // Don't navigate on interactive elements
    if (target.closest('a, button, details, input, select, textarea')) return
    const isRight = e.clientX > window.innerWidth / 2
    navigate(isRight ? 1 : -1)
  })

  // Resize → re-fit。 旧 `window.resize` listener より精度高い ResizeObserver で
  // 各 section 自体の size 変化を直接 watch する。 viewport / orientation /
  // mobile の URL バー collapse 等で section が re-flow された timing で確実に
  // 発火する (window.resize は viewport が完全 settle する前に飛ぶことがあり、
  // 古い dimension で fit してしまう iOS Safari の bug を回避できる)。
  const sectionObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      fitSlide(entry.target as HTMLElement)
    }
  })
  sections.forEach(s => sectionObserver.observe(s))

  // Font load 完了後 全 slide 再 fit。 webfont (IBM Plex Sans JP 等) は async
  // load で、 load 前の text 幅は fallback font ベースの近似値。 load 完了で
  // text dimensions が変わって content の natural size が増減するため、
  // 確定したタイミングで再計算する。
  document.fonts?.ready?.then(() => {
    sections.forEach(fitSlide)
  })

  // Print → fit all slides
  window.addEventListener('beforeprint', () => {
    sections.forEach(fitSlide)
  })
}
