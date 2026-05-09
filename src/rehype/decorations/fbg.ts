import type { Element, ElementContent } from 'hast'
import type { NwytProp, Scope } from '../../types.ts'
import { h } from 'hastscript'
import { findNwytInScope, parseImageNwytValue } from '../nwyt-helpers.ts'
import { footerMaskId, footerShapeId } from './_ids.ts'

/**
 * section に `<div class="fbg-layer">` を fbg (footer 形状で抜いた背景画像)
 * レイヤーとして追加する。
 *
 * 構造:
 * - `<div.fbg-layer>` 直下に
 *   - `<img.fbg-img>` (CSS `mask-image` で footer 形状にクリップされる)
 *   - `<svg.fbg-svg>` (mask 定義のみ。 footer SVG の `<g>` を `<use>` で参照)
 *
 * `<img>` を実体に置くことで bg-layer (`!bg~` 側) と画像取り回しの CSS
 * (object-fit / src 確認 / inspect) が共通化される。 mask 連結は CSS
 * `mask-image: url(#fragment)` で行う。
 *
 * footer.ts が出力する `<g id="footer-shapes-...">` shape group を mask の
 * stencil として再利用する設計。 ID 命名は `_ids.ts` に集約。
 */
export function appendFooterBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
  sectionId: string,
): boolean {
  const fbg = findNwytInScope(scope, globalNwyts, 'fbg')
  if (!fbg) return false
  const parsed = parseImageNwytValue(fbg.rawValue)
  if (!parsed) return false
  const elem = buildFooterBackground(
    parsed.src,
    parsed.alt || fbg.key,
    footerMaskId(sectionId),
    footerShapeId(sectionId),
    fbg.classes,
  )
  el.children.push(elem)
  return true
}

function buildFooterBackground(
  src: string,
  alt: string,
  maskId: string,
  shapeId: string,
  classes: string[],
): ElementContent {
  // <use> の y 位置は SVG attribute で直接付与する。 footer.ts と同じく、
  // iOS Safari は SVG `<use>` への CSS `y` も無視するため (fbg mask の y shift
  // が効かず mask cutout が top に出る現象が iPhone で確認された)。
  // calc(100% - footer-height) で section 下端から footer 高さ分だけ上、 つまり
  // footer-top の位置に mask shape を配置する。
  const mask = h('mask', { id: maskId }, [
    h('use', {
      href: `#${shapeId}`,
      y: 'calc(100% - var(--footer-line-height) - var(--footer-font-size))',
    }),
  ])
  const svg = h('svg.fbg-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, mask)

  const img = h('img.fbg-img', {
    src, alt,
    className: classes,
    style: `-webkit-mask-image: url(#${maskId}); mask-image: url(#${maskId});`,
  }) as ElementContent

  return h('div.fbg-layer', [img, svg]) as ElementContent
}
