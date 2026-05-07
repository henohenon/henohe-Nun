import type { Element, ElementContent } from "hast";
import type { NwytProp, Scope } from "../types.ts";
import { h } from "hastscript";
import { findNwytInScope, parseImageNwytValue } from "./nwyt-helpers.ts";

/**
 * section に `<img class="bg-layer">` を背景レイヤーとして追加する。
 *
 * `<div + bg-image>` ではなく実 `<img>` を使うことで「画像である」が DOM 上で
 * explicit になり、 inspect / src 確認が容易。 CSS は `object-fit: cover` で
 * 同等表現。 fbg と実装パターンを揃える。
 */
export function appendBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
): boolean {
  const bg = findNwytInScope(scope, globalNwyts, 'bg')
  if (!bg) return false
  const parsed = parseImageNwytValue(bg.rawValue)
  if (!parsed) return false
  el.children.unshift(buildBackground(parsed.src, parsed.alt || bg.key))
  return true
}

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
    `footer-mask-${sectionId}`,
    `footer-shapes-${sectionId}`,
  )
  el.children.push(elem)
  return true
}

function buildBackground(src: string, alt: string): ElementContent {
  return h('img.bg-layer', { src, alt }) as ElementContent
}

function buildFooterBackground(
  src: string,
  alt: string,
  maskId: string,
  shapeId: string,
): ElementContent {
  const mask = h('mask', { id: maskId }, [
    h('use', { href: `#${shapeId}` }),
  ])
  const svg = h('svg.fbg-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, mask)

  const img = h('img.fbg-img', {
    src, alt,
    style: `-webkit-mask-image: url(#${maskId}); mask-image: url(#${maskId});`,
  }) as ElementContent

  return h('div.fbg-layer', [img, svg]) as ElementContent
}