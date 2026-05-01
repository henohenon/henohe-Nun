import 'virtual:uno.css'
import '../styles/index.css'

const sections = document.querySelectorAll<HTMLElement>('section')
if (sections.length > 0) {
  initNavigation(sections)
  initZoomFit(sections)
  initCopyButtons()
  initFnTooltips()
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function initNavigation(sections: NodeListOf<HTMLElement>) {
  function currentPage(): number {
    const hash = location.hash.replace('#', '')
    return hash ? parseInt(hash, 10) : 1
  }

  function showSlide(page: number) {
    const go = () => {
      sections.forEach((section, i) => {
        section.style.display = (i + 1 === page) ? 'flex' : 'none'
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
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault()
      navigate(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      navigate(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      location.hash = '#1'
    } else if (e.key === 'End') {
      e.preventDefault()
      location.hash = `#${sections.length}`
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
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      navigate(dx < 0 ? 1 : -1)
    }
  }, { passive: true })

  // Mouse wheel
  let wheelDebounce = false
  document.addEventListener('wheel', (e) => {
    if (wheelDebounce) return
    if (Math.abs(e.deltaY) > 30) {
      navigate(e.deltaY > 0 ? 1 : -1)
      wheelDebounce = true
      setTimeout(() => { wheelDebounce = false }, 300)
    }
  }, { passive: true })

  // Fullscreen click
  document.addEventListener('click', (e) => {
    if (!document.fullscreenElement) return
    const target = e.target as HTMLElement
    // Don't navigate on interactive elements
    if (target.closest('a, button, details, input, select, textarea')) return
    navigate(1)
  })

  // Resize → re-fit current slide
  window.addEventListener('resize', () => {
    const page = currentPage()
    if (sections[page - 1]) fitSlide(sections[page - 1])
  })

  // Print → fit all slides
  window.addEventListener('beforeprint', () => {
    sections.forEach(fitSlide)
  })
}

// ---------------------------------------------------------------------------
// Zoom-fit
// ---------------------------------------------------------------------------

function adjustZoom(
  body: HTMLElement,
  children: HTMLElement[],
  iteration: number,
  currentZoom: number,
): void {
  if (iteration >= 10) return
  const csx = Math.max(
    ...children.map(c => c.offsetLeft + c.offsetWidth - body.offsetLeft), 0
  )
  const csy = Math.max(
    ...children.map(c => c.offsetTop + c.offsetHeight - body.offsetTop), 0
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

function fitSlide(slide: HTMLElement) {
  for (const body of slide.querySelectorAll<HTMLElement>(':scope > .body')) {
    const children = Array.from(body.children) as HTMLElement[]
    if (children.length === 0) continue
    body.style.zoom = ''
    adjustZoom(body, children, 0, 1)
  }
}

function initZoomFit(sections: NodeListOf<HTMLElement>) {
  // Fit is called from navigation on slide change
  // Initial fit handled by showSlide()
}

// ---------------------------------------------------------------------------
// Code copy
// ---------------------------------------------------------------------------

function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('button.copy')
    if (!btn) return
    const figure = btn.closest('figure.code-block')
    const code = figure?.querySelector('code')
    if (!code) return

    try {
      await navigator.clipboard.writeText(code.textContent ?? '')
      const original = btn.textContent
      btn.textContent = 'copied'
      setTimeout(() => { btn.textContent = original }, 1500)
    } catch {
      // Clipboard API not available
    }
  })
}

// ---------------------------------------------------------------------------
// Footnote tooltips
// ---------------------------------------------------------------------------

function initFnTooltips() {
  document.addEventListener('mouseenter', (e) => {
    const sup = (e.target as HTMLElement).closest('sup[data-fn]')
    if (!sup) return
    const tooltip = sup.nextElementSibling as HTMLElement | null
    if (tooltip?.classList.contains('fn-tooltip')) {
      tooltip.hidden = false
    }
  }, true)

  document.addEventListener('mouseleave', (e) => {
    const sup = (e.target as HTMLElement).closest('sup[data-fn]')
    if (!sup) return
    const tooltip = sup.nextElementSibling as HTMLElement | null
    if (tooltip?.classList.contains('fn-tooltip')) {
      tooltip.hidden = true
    }
  }, true)
}
