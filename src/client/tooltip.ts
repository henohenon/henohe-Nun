/**
 * 脚注 (`!fn[id]`) の tooltip を初期化する。
 *
 * SSG 側は `<sup data-fn="id">` の **子** に `<template>` を置いてある
 * (`resolve-footnotes.ts` 参照、 HTML5 adoption agency 回避のため `<p>` 内で
 * block 要素を直接置けない場面のための仕掛け)。 起動時に各 sup を走査して
 * 自身の template を見つけ、 中身を `<div class="fn-tooltip">` として sup の
 * 子に複製する。 sup 基点の `position: absolute` で右下に出せる。
 *
 * mouseenter / mouseleave で hidden 属性の付け外し。 `[hidden]` で初期非表示。
 */

export function initFnTooltips(): void {
  for (const sup of document.querySelectorAll<HTMLElement>('sup[data-fn]')) {
    const tpl = sup.querySelector<HTMLTemplateElement>(':scope > template[data-fn]')
    if (!tpl) continue
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
