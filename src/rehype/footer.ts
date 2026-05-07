import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import type { Scope, NwytProp } from '../types.ts'
import { parseNwytValue } from './templates.ts'

/**
 * section レベルの Scope にフッターを追加する。
 * フッターは常に SVG（line + text）で描画する。
 */
export function appendFooter(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
  sectionId: string,
): void {
  const fl  = findNwyt(scope.nwyts, 'fl')  ?? findNwyt(globalNwyts, 'fl')
  const fr  = findNwyt(scope.nwyts, 'fr')  ?? findNwyt(globalNwyts, 'fr')

  // footer 自体は fl / fr のどちらかが無いと出さない (テキストゼロのフッターは
  // 罫線だけになり装飾過剰)。fbg は footer の SVG mask 経由で適用されるので
  // 必然的に footer と運命共同体。
  if (!fl && !fr) return

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
  const shapesId = `footer-shapes-${id}`

  const flNodes = fl ? hastToSvgContent(parseNwytValue('fl', fl.rawValue)) : []
  const frNodes = fr ? hastToSvgContent(parseNwytValue('fr', fr.rawValue)) : []
  const shapeGroup  = h('g', { id: shapesId }, buildShapes(flNodes, frNodes));

  const svg = h('svg.footer-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, shapeGroup);

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
  if (flNodes.length > 0) {
    items.push(h('text.footer-fl', flNodes) as ElementContent)
  }
  if (frNodes.length > 0) {
    items.push(h('text.footer-fr', frNodes) as ElementContent)
  }
  return items
}

// ---------------------------------------------------------------------------
// hast inline → SVG tspan
// ---------------------------------------------------------------------------

/**
 * hast のインライン要素を SVG tspan ノードに変換する。
 * strong / em / del のみ対応（フッターで実用的な装飾範囲）。
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findNwyt(nwyts: NwytProp[], key: string): NwytProp | undefined {
  return nwyts.find(n => n.key === key)
}
