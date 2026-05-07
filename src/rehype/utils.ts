import type { Element, ElementContent, Root } from 'hast'
import { visit, SKIP } from 'unist-util-visit'

/**
 * `<p>` の中身が空白除く 1 要素だけで、 かつその要素が predicate で true
 * を返す場合、 その要素で `<p>` を置き換える。
 *
 * 用途: card 等の block-like な装飾コンテンツが Markdown パースで自動的に
 * `<p>` に包まれた時、 親 p の adoption agency 干渉を避けるため unwrap する。
 *
 * 例:
 * ```ts
 * unwrapSingleChildParagraph(tree, (el) =>
 *   el.tagName === 'a' &&
 *   Array.isArray(el.properties?.className) &&
 *   (el.properties.className as string[]).includes('card'),
 * )
 * ```
 */
export function unwrapSingleChildParagraph(
  tree: Root | Element,
  predicate: (only: Element) => boolean,
): void {
  visit(tree, 'element', (pNode: Element, pIndex, pParent) => {
    if (pNode.tagName !== 'p' || !pParent || pIndex == null) return
    const meaningful = (pNode.children as ElementContent[]).filter(c =>
      !(c.type === 'text' && /^\s*$/.test(c.value)),
    )
    if (meaningful.length !== 1) return
    const only = meaningful[0]
    if (only.type !== 'element') return
    if (!predicate(only)) return
    pParent.children.splice(pIndex, 1, only)
    return [SKIP, pIndex] as const
  })
}
