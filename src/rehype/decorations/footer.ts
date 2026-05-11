import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import type { Scope, NwytProp } from '../../types.ts'
import { parseNwytValue } from '../templates.ts'
import { findNwytInScope } from '../nwyt-helpers.ts'
import { footerShapeId } from './_ids.ts'

/**
 * section レベルの Scope にフッターを追加する。
 * フッターは常に SVG (line + text) で描画する。
 */
export function appendFooter(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
  sectionId: string,
): void {
  const fl = findNwytInScope(scope, globalNwyts, 'fl')
  const fr = findNwytInScope(scope, globalNwyts, 'fr')

  el.children.push(buildFooter(sectionId, fl, fr) as ElementContent)
}

// ---------------------------------------------------------------------------
// Footer builder
// ---------------------------------------------------------------------------

function buildFooter(
  id: string,
  fl: NwytProp | undefined,
  fr: NwytProp | undefined,
): Element {
  const flNodes = fl ? hastToSvgContent(parseNwytValue('fl', fl.rawValue)) : []
  const frNodes = fr ? hastToSvgContent(parseNwytValue('fr', fr.rawValue)) : []
  const shapeGroup = h('g', { id: footerShapeId(id) }, buildShapes(flNodes, frNodes))

  const svg = h('svg.footer-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, shapeGroup)

  return h('footer', svg)
}

/** line + fl text + fr text の SVG 形状を生成
 *
 * footer height = font-size + line-height (= font * 1.7, k=0.7)
 * text y = font * 1.0 → 59%  (定数: rect 上端に baseline が乗る)
 * rect y = 60%, height = 100% (SVG overflow:hidden でクリップ → 端数ギャップなし)
 */
function buildShapes(
  flNodes: ElementContent[],
  frNodes: ElementContent[],
): ElementContent[] {
  const items: ElementContent[] = []
  items.push(h('rect.footer-rule') as ElementContent)
  // text 要素の位置は **SVG attribute** で直接付与する。 CSS で `x` / `translate`
  // を当てる経路は iOS Safari (= iPhone Chrome) で機能しない (T1-T6 検証済、
  // mobile-test slide 2):
  //   - CSS `x: 100%` → text 完全消失 (T2)
  //   - CSS `translate: calc(100% - X) Y` → 左端寄り (T3-T5)
  //   - SVG attr `x="100%"` + SVG `transform` attribute → ✅ 期待通り右端 (T1/T6)
  // ここでは em 単位で font-size 相対の padding を表現 (--footer-font-size と
  // --footer-pad-x は両方 ~4cqmin ベースなので em で近似可能)。
  if (flNodes.length > 0) {
    items.push(h('text.footer-fl', { x: '0.6em', y: '1em' }, flNodes) as ElementContent)
  }
  if (frNodes.length > 0) {
    items.push(h('text.footer-fr', { x: '100%', y: '1em', dx: '-0.6em', textAnchor: 'end' }, frNodes) as ElementContent)
  }
  return items
}

// ---------------------------------------------------------------------------
// hast inline → SVG tspan
// ---------------------------------------------------------------------------

/**
 * hast のインライン要素を SVG tspan ノードに変換する。
 * strong / em / del のみ対応 (フッターで実用的な装飾範囲)。
 */
function hastToSvgContent(children: ElementContent[]): ElementContent[] {
  return children.flatMap(child => {
    if (child.type === 'text') return [child]
    if (child.type !== 'element') return []

    const attrs: Record<string, string> = {}
    switch (child.tagName) {
      case 'strong': attrs.fontWeight = 'bold'; break
      case 'em':     attrs.fontStyle  = 'italic'; break
      case 'del':    attrs.textDecoration = 'line-through'; break
      // code, span 等はそのまま内側をフラット化
    }

    const inner = hastToSvgContent(child.children as ElementContent[])
    return [h('tspan', attrs, inner) as ElementContent]
  })
}
