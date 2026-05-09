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
  // mask shape の y 位置: 「inner `<svg y="100%">` で section 下端に viewport
  // を作り、 そこから `<use y="-1.2em">` で 1.2em 上に shift」 という構造で
  // calc を一切使わずに footer 位置を再現する。
  //
  // 経緯: 元 CSS `.fbg-svg > mask > use { y: calc(100% - var(--line) - var(--font)) }`
  // は iOS Safari で評価されない。 SVG attribute に同じ calc を移しても (T7-T11
  // の検証で確認済) iOS は calc + 任意の単位を全滅させる。 一方 literal 単位
  // (`100%` や `em`) は SVG attribute で動く (T1 / fl/fr の em literal が証明)。
  // → calc を使わず literal で構成できるよう nested svg + 負 em で表現。
  //
  // em 算出根拠: body font-size ≈ 5cqmin、 footer height = footer-font-size +
  // footer-line-height ≈ 4cqmin + 2cqmin = 6cqmin。 1.2em (body) ≈ 6cqmin で
  // footer height と近似。 floor / ceiling もほぼ揃う。
  const mask = h('mask', { id: maskId }, [
    h('svg', { y: '100%', overflow: 'visible' }, [
      h('use', {
        href: `#${shapeId}`,
        y: '-1.2em',
      }),
    ]),
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
