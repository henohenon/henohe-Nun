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
  const fl  = findNwyt(scope.nwyts, 'fl')  ?? findNwyt(globalNwyts, 'fl')
  const fr  = findNwyt(scope.nwyts, 'fr')  ?? findNwyt(globalNwyts, 'fr')
  const fbg = findNwyt(scope.nwyts, 'fbg') ?? findNwyt(globalNwyts, 'fbg')
  const bg  = findNwyt(scope.nwyts, 'bg')  ?? findNwyt(globalNwyts, 'bg')

  // bg は section 内の専用 `<img class="bg-layer">` で扱う。`<div + bg-image>`
  // ではなく実 `<img>` を使うことで「画像である」が DOM 上で explicit になり、
  // inspect / src 確認が容易。CSS は `object-fit: cover` で同等表現。fbg と
  // 実装パターンを揃える。
  if (bg) {
    const src = extractImageSrc(bg.rawValue)
    if (src) {
      const bgLayer = h('img.bg-layer', { src, alt: '' }) as ElementContent
      el.children.unshift(bgLayer)
    }
  }

  // footer 自体は fl / fr のどちらかが無いと出さない (テキストゼロのフッターは
  // 罫線だけになり装飾過剰)。fbg は footer の SVG mask 経由で適用されるので
  // 必然的に footer と運命共同体。
  if (!fl && !fr) return

  const sectionId = String(el.properties?.id ?? '0')
  el.children.push(buildFooter(sectionId, fl, fr, fbg) as ElementContent)
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

  const fbgSrc = fbg ? extractImageSrc(fbg.rawValue) : null

  if (fbg && fbgSrc) {
    // SVG には <defs> (shapes + mask) のみ置く。実画像は footer 内の専用
    // `<img class="fbg-layer">` に CSS mask-image で SVG mask を参照して
    // shapes 形状に切り抜く。bg-layer と同じく `<img>` で扱う。
    svgChildren.push(h('defs', [
      h('g', { id: shapesId }, shapes),
      h('mask', { id: maskId, maskUnits: 'userSpaceOnUse' }, [
        h('rect', { x: '-9999', y: '-9999', width: '19998', height: '19998', fill: 'black' }),
        h('use', { href: `#${shapesId}`, style: 'fill: white; stroke: white;' }),
      ]),
    ]) as ElementContent)
  } else {
    // 通常 footer (fbg なし) または fbg src 解決失敗: 普通に shapes を描画
    svgChildren.push(...shapes)
  }

  const footerChildren: ElementContent[] = []
  if (fbgSrc) {
    footerChildren.push(h('img.fbg-layer', {
      src: fbgSrc,
      alt: '',
      style: `-webkit-mask-image: url(#${maskId}); mask-image: url(#${maskId});`,
    }) as ElementContent)
  }
  footerChildren.push(h('svg.footer-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, svgChildren) as ElementContent)

  const cls = fbgSrc ? 'footer.masked' : 'footer'
  return h(cls, footerChildren)
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
  // nwyt syntax の `!` は外側 prop syntax で消費済み。rawValue は `[alt](url)`
  // で渡る (Markdown の `![alt](url)` のように `!` をもう一度書く慣例ではない)。
  // 念のため `!` 付きも受け付け、最後に素のパス fallback。
  const match = raw.match(/!?\[([^\]]*)\]\(([^)]+)\)/)
  if (match) return match[2]
  const trimmed = raw.trim()
  return trimmed || null
}
