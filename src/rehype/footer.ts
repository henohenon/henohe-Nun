import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import type { Scope, VFileData, NwytProp } from '../types.ts'
import { parseNwytValue } from './templates.ts'

/**
 * section レベルの Scope にフッターを追加する。
 * フッターは常に SVG（line + text）で描画する。
 * !fbg がある場合は SVG 形状を mask として流用し、画像を切り抜く。
 */
export function appendFooter(
  el: Element,
  scope: Scope,
  data: VFileData,
  globalNwyts: NwytProp[],
): void {
  const fl = findNwyt(scope.nwyts, 'fl') ?? findNwyt(globalNwyts, 'fl')
  const fr = findNwyt(scope.nwyts, 'fr') ?? findNwyt(globalNwyts, 'fr')
  if (!fl && !fr) return

  const fbg = findNwyt(scope.nwyts, 'fbg') ?? findNwyt(globalNwyts, 'fbg')
  const bg  = findNwyt(scope.nwyts, 'bg')  ?? findNwyt(globalNwyts, 'bg')

  const sectionId = String(el.properties?.id ?? '0')
  el.children.push(buildFooter(sectionId, fl, fr, fbg) as ElementContent)

  if (bg) {
    const src = extractImageSrc(bg.rawValue)
    if (src) {
      el.properties ??= {}
      el.properties.style = `background-image: url('${src}')`
    }
  }
}

// ---------------------------------------------------------------------------
// Footer builder
// ---------------------------------------------------------------------------

function buildFooter(
  id: string,
  fl: NwytProp | undefined,
  fr: NwytProp | undefined,
  fbg: NwytProp | undefined,
): Element {
  const maskId   = `footer-mask-${id}`
  const shapesId = `footer-shapes-${id}`

  const flNodes = fl ? hastToSvgContent(parseNwytValue('fl', fl.rawValue)) : []
  const frNodes = fr ? hastToSvgContent(parseNwytValue('fr', fr.rawValue)) : []
  const shapes  = buildShapes(flNodes, frNodes)

  const svgChildren: ElementContent[] = []

  if (fbg) {
    const src = extractImageSrc(fbg.rawValue)
    // Shapes を <defs> に入れて <use> で参照 → mask にも可視レイヤーにも流用
    svgChildren.push(h('defs', [
      h('g', { id: shapesId }, shapes),
      h('mask', { id: maskId, maskUnits: 'userSpaceOnUse' }, [
        // mask 全体を黒（非表示）にしてから shapes の部分を白（表示）で上書き
        h('rect', { x: '-9999', y: '-9999', width: '19998', height: '19998', fill: 'black' }),
        h('use', { href: `#${shapesId}`, style: 'fill: white; stroke: white;' }),
      ]),
    ]) as ElementContent)
    // !fbg 画像（mask で形状に切り抜き）
    if (src) {
      svgChildren.push(h('image', {
        class: 'fbg-layer',
        href: src,
        x: '0', y: '0', width: '100%', height: '100%',
        preserveAspectRatio: 'xMidYMid slice',
        mask: `url(#${maskId})`,
      }) as ElementContent)
    }
    // 可視フッター形状
    svgChildren.push(h('use', { href: `#${shapesId}` }) as ElementContent)
  } else {
    svgChildren.push(...shapes)
  }

  const cls = fbg ? 'footer.masked' : 'footer'
  return h(cls, [
    h('svg.footer-svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true',
    }, svgChildren) as ElementContent,
  ])
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

function extractImageSrc(raw: string): string | null {
  const match = raw.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  if (match) return match[2]
  const trimmed = raw.trim()
  return trimmed || null
}
