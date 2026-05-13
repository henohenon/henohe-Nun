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
  const bg = findNwytInScope(scope, globalNwyts, 'bg')
  if (!bg) return false
  // 値 reference 構文 `!bg~=<key>`: bg の値を別の nwyt (典型的には fbg) の値で
  // 解決する。 title slide 等で fbg と bg が同 URL になる場合の `!bg~[](url)`
  // 重複記述を避ける shortcut。 spec docs/spec/syntax.md の 「値 reference 構文」
  // 節参照。 chain (=fbg → =bg) は depth 0 で refuse (循環防止)。
  const resolved = resolveValueRef(bg, scope, globalNwyts)
  if (!resolved) return false
  const parsed = parseImageNwytValue(resolved.rawValue)
  if (!parsed) return false
  el.children.unshift(buildBackground(parsed.src, parsed.alt || bg.key, bg.classes))
  return true
}

/** 値が `=<key>` 形式なら同 scope (または global) の `<key>` nwyt を返す。
 *  そうでなければ元の nwyt をそのまま返す。 解決不能 / 自己参照 / chain は null。 */
function resolveValueRef(
  nwyt: NwytProp,
  scope: Scope,
  globalNwyts: NwytProp[],
): NwytProp | null {
  if (!nwyt.rawValue.startsWith('=')) return nwyt
  const refKey = nwyt.rawValue.slice(1).trim()
  if (!refKey || refKey === nwyt.key) return null
  const ref = findNwytInScope(scope, globalNwyts, refKey)
  if (!ref) return null
  if (ref.rawValue.startsWith('=')) return null
  return ref
}

function buildBackground(src: string, alt: string, classes: string[]): ElementContent {
  const img = h('img.bg-img', { src, alt, className: classes })
  return h('div.bg-layer', [img]) as ElementContent
}
