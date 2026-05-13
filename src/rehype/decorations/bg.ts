import type { Element, ElementContent } from 'hast'
import type { NwytProp, Scope } from '../../types.ts'
import { h } from 'hastscript'
import { findNwytInScope, parseImageNwytValue } from '../nwyt-helpers.ts'

/**
 * section に `<div class="bg-layer"><img class="bg-img"></div>` を背景レイヤー
 * として追加する。
 *
 * wrapper 構造は fbg と揃えるため (fbg は wrapper div に mask を当てる必要が
 * あるので、 bg も symmetric な div>img 構造にして CSS 共有 + 概念統一)。
 * 内側に実 `<img>` を置くことで「画像である」が DOM 上で explicit になり
 * inspect / src 確認が容易、 UnoCSS class も img 本体に効く。
 */
export function appendBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
): boolean {
  let bg = findNwytInScope(scope, globalNwyts, 'bg')
  // .bg-from-fbg: bg が個別指定されていない場合、 fbg の値を mirror して
  // bg としても使う。 title slide で「fbg と同じ画像を bg にも使いたい」 を
  // `!bg~` 重複指定なしに表現するための shortcut。 spec syntax.md 参照。
  if (!bg && scope.classes.includes('bg-from-fbg')) {
    bg = findNwytInScope(scope, globalNwyts, 'fbg')
  }
  if (!bg) return false
  const parsed = parseImageNwytValue(bg.rawValue)
  if (!parsed) return false
  el.children.unshift(buildBackground(parsed.src, parsed.alt || bg.key, bg.classes))
  return true
}

function buildBackground(src: string, alt: string, classes: string[]): ElementContent {
  const img = h('img.bg-img', { src, alt, className: classes })
  return h('div.bg-layer', [img]) as ElementContent
}
