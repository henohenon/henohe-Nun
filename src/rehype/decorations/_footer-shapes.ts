import { h } from 'hastscript'
import type { ElementContent } from 'hast'
import type { NwytProp } from '../../types.ts'
import { parseNwytValue } from '../templates.ts'

/**
 * footer の SVG shapes (rect + fl/fr text) を生成する共有 helper。
 *
 * footer.ts (visible footer) と fbg.ts (mask 内 inline) の両方が同じ shape
 * 構造を必要とするため、 ここで一元化。 旧構造では footer の `<g id>` を
 * fbg の mask が `<use href>` で参照していたが、 Chromium PDF backend で
 * cross-element ref が resolve しない / mask 内 CSS positioning が effective
 * じゃない問題があり、 fbg は inline で同じ shape を持つ方針に。
 *
 * 戻り値は children の配列。 呼び出し側で `<g>` でも `<svg>` でもラップして
 * 使える。
 */
export function buildFooterShapes(
  fl: NwytProp | undefined,
  fr: NwytProp | undefined,
): ElementContent[] {
  const flNodes = fl ? hastToSvgContent(parseNwytValue('fl', fl.rawValue)) : []
  const frNodes = fr ? hastToSvgContent(parseNwytValue('fr', fr.rawValue)) : []

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
