import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import type { Scope, NwytProp } from '../../types.ts'
import { findNwytInScope } from '../nwyt-helpers.ts'
import { buildFooterShapes } from './_footer-shapes.ts'

/**
 * section レベルの Scope にフッターを追加する。
 * フッターは常に SVG (line + text) で描画する。
 *
 * shape 構造は `_footer-shapes.ts` の `buildFooterShapes` で fbg と共有。
 */
export function appendFooter(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 互換性のため受けるが現状未使用
  _sectionId: string,
): void {
  const fl = findNwytInScope(scope, globalNwyts, 'fl')
  const fr = findNwytInScope(scope, globalNwyts, 'fr')

  // footer 自体は fl / fr のどちらかが無いと出さない (テキストゼロのフッターは
  // 罫線だけになり装飾過剰)。
  if (!fl && !fr) return

  el.children.push(buildFooter(fl, fr) as ElementContent)
}

function buildFooter(
  fl: NwytProp | undefined,
  fr: NwytProp | undefined,
): Element {
  const svg = h('svg.footer-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, buildFooterShapes(fl, fr))

  return h('footer', svg)
}
