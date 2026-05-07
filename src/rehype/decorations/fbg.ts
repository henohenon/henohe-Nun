import type { Element, ElementContent } from 'hast'
import type { NwytProp, Scope } from '../../types.ts'
import { h } from 'hastscript'
import { findNwytInScope, parseImageNwytValue } from '../nwyt-helpers.ts'
import { footerMaskId, footerShapeId } from './_ids.ts'

/**
 * section に `<svg class="fbg-layer">` を fbg (footer 形状で抜いた背景画像)
 * レイヤーとして追加する。
 *
 * 構造: 単一 SVG 内に `<mask>` (footer shape を `<use>` で参照) と
 * `<image>` (元画像、 mask 属性で footer 形状に切り抜き) を内包。
 *
 * 旧構造は `<div class="fbg-layer">` 内に `<img>` + `<svg>` を並べて CSS
 * `mask-image: url(#fragment)` で連携していたが、 Chromium の PDF backend
 * が CSS mask + fragment URL を resolve しない問題があった。 SVG `mask`
 * 属性 + SVG `<image>` 要素に統合することで PDF / screen どちらでも標準
 * SVG として render される。
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
  )
  el.children.push(elem)
  return true
}

function buildFooterBackground(
  src: string,
  alt: string,
  maskId: string,
  shapeId: string,
): ElementContent {
  return h('svg.fbg-layer', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    preserveAspectRatio: 'xMidYMid slice',
  }, [
    h('mask', { id: maskId }, [
      h('use', { href: `#${shapeId}` }),
    ]),
    h('image', {
      href: src,
      width: '100%',
      height: '100%',
      preserveAspectRatio: 'xMidYMid slice',
      mask: `url(#${maskId})`,
    }, alt ? [h('title', alt)] : []),
  ]) as ElementContent
}
