import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'
import { h } from 'hastscript'

/**
 * rehype plugin: !fn[id] の nwytContent ノードを <sup data-fn="id"> に変換する。
 * Scope 抽出前に実行。tooltip も href もこの段階では未設定。
 */
export const rehypeNunFnRef: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return

      // nwytContent handler が生成した <span class="nwyt-fn" data-nwyt="fn">
      if (
        node.tagName === 'span' &&
        node.properties?.['dataNwyt'] === 'fn'
      ) {
        // children のテキストが脚注 id
        const id = getTextContent(node).trim()
        if (!id) return

        const sup = h('sup', { 'data-fn': id }, [
          { type: 'text', value: id },
        ])

        parent.children[index] = sup
      }
    })
  }
}

function getTextContent(node: Element): string {
  let text = ''
  for (const child of node.children) {
    if (child.type === 'text') {
      text += child.value
    } else if (child.type === 'element') {
      text += getTextContent(child)
    }
  }
  return text
}
