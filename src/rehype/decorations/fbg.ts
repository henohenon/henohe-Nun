import type { Element, ElementContent } from 'hast'
import type { NwytProp, Scope } from '../../types.ts'
import { h } from 'hastscript'
import { findNwytInScope, parseImageNwytValue } from '../nwyt-helpers.ts'
import { footerMaskId } from './_ids.ts'
import { buildFooterShapes } from './_footer-shapes.ts'

/**
 * section に `<svg class="fbg-layer">` を fbg (footer 形状で抜いた背景画像)
 * レイヤーとして追加する。
 *
 * 構造: 単一 SVG 内に
 *   - `<mask>` (footer shapes を **inline** で持つ; `.fbg-shapes` でラップ)
 *   - `<image>` (元画像、 mask 属性で footer 形状に切り抜き)
 * を内包。
 *
 * 旧版は footer の `<g id>` を `<use href>` で参照していたが、 Chromium PDF
 * backend が cross-element ref を resolve しない (+ mask 内 CSS positioning も
 * 不安定) 問題で PDF 出力時に fbg が破綻していた。 shape を inline 化して
 * 完全 self-contained にすることで PDF / screen どちらでも render される。
 *
 * shape 生成は `_footer-shapes.ts` の `buildFooterShapes` で footer.ts と共有。
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

  const fl = findNwytInScope(scope, globalNwyts, 'fl')
  const fr = findNwytInScope(scope, globalNwyts, 'fr')

  const elem = buildFooterBackground(
    parsed.src,
    parsed.alt || fbg.key,
    footerMaskId(sectionId),
    fl,
    fr,
  )
  el.children.push(elem)
  return true
}

function buildFooterBackground(
  src: string,
  alt: string,
  maskId: string,
  fl: NwytProp | undefined,
  fr: NwytProp | undefined,
): ElementContent {
  return h('svg.fbg-layer', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    preserveAspectRatio: 'xMidYMid slice',
  }, [
    h('mask', { id: maskId }, [
      h('g.fbg-shapes', buildFooterShapes(fl, fr)),
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
