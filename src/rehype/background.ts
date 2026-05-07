import type {Element, ElementContent} from "hast";
import type {NwytProp, Scope} from "../types.ts";
import {h} from "hastscript";

export function appendBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
) {
  const bg  = findNwyt(scope.nwyts, 'bg')  ?? findNwyt(globalNwyts, 'bg')


  // bg は section 内の専用 `<img class="bg-layer">` で扱う。`<div + bg-image>`
  // ではなく実 `<img>` を使うことで「画像である」が DOM 上で explicit になり、
  // inspect / src 確認が容易。CSS は `object-fit: cover` で同等表現。fbg と
  // 実装パターンを揃える。
  if (!bg) return false;
  const src = extractImageSrc(bg?.rawValue ?? '')
  if (!src) return false;
  const alt = bg?.key ?? 'bg'
  const bgElem = buildBackground(src, alt);
  el.children.unshift(bgElem);
  return true;
}

export function appendFooterBackground(
  el: Element,
  scope: Scope,
  globalNwyts: NwytProp[],
  sectionId: string
): boolean {
  const fbg = findNwyt(scope.nwyts, 'fbg') ?? findNwyt(globalNwyts, 'fbg')

  if (!fbg) return false;
  const src = extractImageSrc(fbg.rawValue)
  if (!src) return false;
  const alt = fbg.key ?? 'fbg'
  const elem = buildFooterBackground(src, alt, `footer-mask-${sectionId}`, `footer-shapes-${sectionId}`);
  el.children.push(elem);
  return true;
}

function buildBackground(
  src: string,
  alt: string,
): ElementContent {
  return h('img.bg-layer', { src, alt }) as ElementContent
}

function buildFooterBackground(src: string, alt: string, maskId: string, shapeId: string): ElementContent{
  const mask = h('mask', { id: maskId }, [
    h('use', { href: `#${shapeId}` })
  ]);
  const svg = h('svg.fbg-svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }, mask);

  const img = h('img.fbg-img', {
    src, alt,
    style: `-webkit-mask-image: url(#${maskId}); mask-image: url(#${maskId});`,
  }) as ElementContent

  return h('div.fbg-layer', [img, svg]) as ElementContent
}

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