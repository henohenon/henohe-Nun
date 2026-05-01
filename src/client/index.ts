import 'virtual:uno.css'
import '../styles/index.css'

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll<HTMLElement>('section')
  if (sections.length === 0) return

  // Show the section referenced by hash, or the first one
  function showSlide() {
    const hash = location.hash.replace('#', '')
    const target = hash ? parseInt(hash, 10) : 1

    sections.forEach((section, i) => {
      section.style.display = (i + 1 === target) ? 'flex' : 'none'
    })
  }

  showSlide()
  window.addEventListener('hashchange', showSlide)

  // Basic keyboard navigation
  document.addEventListener('keydown', (e) => {
    const hash = location.hash.replace('#', '')
    const current = hash ? parseInt(hash, 10) : 1

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      if (current < sections.length) {
        location.hash = `#${current + 1}`
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (current > 1) {
        location.hash = `#${current - 1}`
      }
    }
  })
})
