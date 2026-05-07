/**
 * 脚注 (`!fn[id]`) の tooltip を初期化する。
 *
 * SSG 側は `<template data-fn="id">...</template>` を `<sup data-fn="id">` の
 * sibling として置いてある (HTML5 adoption agency 回避のため `<sup>` の親
 * `<p>` 内では block 要素を sibling 配置できない時のための仕掛け)。 起動時に
 * template の中身を `<div class="fn-tooltip">` として sup の子に複製して、
 * sup 基点の `position: absolute` で右下に出せるようにする。
 *
 * mouseenter / mouseleave で hidden 属性の付け外し。 `[hidden]` で初期非表示。
 */

export function initFnTooltips(): void {
  for (const tpl of document.querySelectorAll<HTMLTemplateElement>('template[data-fn]')) {
    const fnId = tpl.dataset.fn
    if (!fnId) continue
    const sup = document.querySelector<HTMLElement>(`sup[data-fn="${CSS.escape(fnId)}"]`)
    if (!sup) continue
    const div = document.createElement('div')
    div.className = 'fn-tooltip'
    div.hidden = true
    div.appendChild(tpl.content.cloneNode(true))
    sup.appendChild(div)
  }

  document.addEventListener('mouseenter', (e) => {
    if (!(e.target instanceof Element)) return
    const sup = e.target.closest<HTMLElement>('sup[data-fn]')
    if (!sup) return
    const tooltip = sup.querySelector<HTMLElement>(':scope > .fn-tooltip')
    if (tooltip) tooltip.hidden = false
  }, true)

  document.addEventListener('mouseleave', (e) => {
    if (!(e.target instanceof Element)) return
    const sup = e.target.closest<HTMLElement>('sup[data-fn]')
    if (!sup) return
    const tooltip = sup.querySelector<HTMLElement>(':scope > .fn-tooltip')
    if (tooltip) tooltip.hidden = true
  }, true)
}
