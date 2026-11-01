// 縦横比でランドスケープ版 / ポートレート版を切り替える (スライド位置は hash で引き継ぐ)
(() => {
  const mq = matchMedia('(max-aspect-ratio: 1/1)')
  const go = () => {
    const want = mq.matches ? 'deck-portrait.html' : 'deck-nun.html'
    if (!location.pathname.endsWith('/' + want)) location.replace(want + location.hash)
  }
  go()
  mq.addEventListener('change', go)
})()
