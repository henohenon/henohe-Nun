/**
 * footer SVG の `<g>` shape group / `<mask>` で使う ID 生成。
 *
 * footer.ts と fbg.ts (mbg-layer の `mask-image: url(#...)` 参照) で同じ
 * 形式の ID を生成するため、 1 箇所に集約して命名規則をブレないようにする。
 *
 * セクション (slide) ごとに ID を unique 化する必要がある (1 枚目の mask が
 * 2 枚目以降から `<use>` で参照される事故を避けるため document 内で衝突しない)。
 */

export function footerShapeId(sectionId: string): string {
  return `footer-shapes-${sectionId}`
}

export function footerMaskId(sectionId: string): string {
  return `footer-mask-${sectionId}`
}
