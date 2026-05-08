import type { Element, ElementContent } from 'hast'
import type { NwytProp, Scope } from '../../types.ts'
import { h } from 'hastscript'
import { findNwytInScope, parseImageNwytValue } from '../nwyt-helpers.ts'

/**
 * section に `<img class="bg-layer">` を背景レイヤーとして追加する。
 *
 * `<div + bg-image>` ではなく実 `<img>` を使うことで「画像である」が DOM 上で
 * explicit になり、 inspect / src 確認が容易。 CSS は `object-fit: cover` で
 * 同等表現。 fbg と実装パターンを揃える。
 */
export function appendBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
): boolean {
  const bg = findNwytInScope(scope, globalNwyts, 'bg')
  if (!bg) return false
  const parsed = parseImageNwytValue(bg.rawValue)
  if (!parsed) return false
  el.children.unshift(buildBackground(parsed.src, parsed.alt || bg.key, bg.classes))
  return true
}

function buildBackground(src: string, alt: string, classes: string[]): ElementContent {
  return h('img.bg-layer', { src, alt, className: classes }) as ElementContent
}
