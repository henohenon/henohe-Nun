import type { Plugin } from 'unified'
import type { Root, Code } from 'mdast'
import { visit } from 'unist-util-visit'
import type { VFileData } from '../types.ts'

/**
 * remark plugin: ~~~meta ブロックを検出し、key: value をパースして
 * vfile.data.meta に格納。ツリーからは削除。
 */
export const remarkNunMeta: Plugin<[], Root> = function () {
  return (tree, file) => {
    const data = file.data as Partial<VFileData>
    data.meta ??= {}

    const toRemove: Code[] = []

    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'meta' && node.value) {
        for (const line of node.value.split(/\r?\n/)) {
          const match = line.match(/^([^:]+):\s*(.*)$/)
          if (match) {
            data.meta![match[1].trim()] = match[2].trim()
          }
        }
        toRemove.push(node)
      }
    })

    // ツリーから削除
    visit(tree, (node, index, parent) => {
      if (parent && index !== undefined && toRemove.includes(node as Code)) {
        parent.children.splice(index, 1)
        return index  // 同じインデックスを再走査
      }
    })
  }
}
