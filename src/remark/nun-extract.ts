import type { Plugin } from 'unified'
import type { Root, Parent } from 'mdast'
import { visit } from 'unist-util-visit'
import type { VFileData, TemplateEntry, NwytProp, TemplateName } from '../types.ts'
import { TEMPLATE_NAMES } from '../types.ts'

const validTemplates: ReadonlySet<string> = new Set(TEMPLATE_NAMES)

/**
 * remark plugin: nunTemplate / nunNwytProp mdast ノードを走査して
 * vfile.data に移動＆ツリーから削除する。
 *
 * - nunTemplate → vfile.data.templates
 * - nunNwytProp → vfile.data.nwyts (key=fn の場合は vfile.data.footnotes にも)
 */
export const remarkNunExtract: Plugin<[], Root> = function () {
  return (tree, file) => {
    const data = file.data as VFileData
    data.templates ??= []
    data.nwyts ??= []
    data.footnotes ??= {}

    const toRemove = new Set<unknown>()

    visit(tree, (node: any) => {
      if (node.type === 'nunTemplate' && node.position) {
        const template = node.template as string | undefined
        const entry: TemplateEntry = {
          template: template && validTemplates.has(template)
            ? template as TemplateName
            : undefined,
          classes: node.classes as string[] ?? [],
          position: node.position,
        }
        data.templates.push(entry)
        toRemove.add(node)
      }

      if (node.type === 'nunNwytProp' && node.position) {
        const prop: NwytProp = {
          key: node.key as string,
          classes: node.classes as string[] ?? [],
          rawValue: node.rawValue as string ?? '',
          position: node.position,
        }
        data.nwyts.push(prop)

        // 脚注定義の収集
        if (prop.key === 'fn') {
          const idMatch = prop.rawValue.match(/^\[(.+)\]$/)
          if (idMatch) {
            data.footnotes[idMatch[1]] = {
              position: node.position,
              classes: prop.classes,
            }
          }
        }

        toRemove.add(node)
      }
    })

    // ツリーから削除（親を辿って splice）
    visit(tree, (node, index, parent) => {
      if (parent && index !== undefined && toRemove.has(node)) {
        ;(parent as Parent).children.splice(index, 1)
        return index
      }
    })
  }
}
