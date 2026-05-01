import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * rehype plugin that pre-processes code blocks before shiki.
 *
 * Handles:
 * - diff_lang: `language-diff_typescript` -> diff mode + lang
 * - embed_xxx: `language-embed_html` -> nunEmbed custom element
 * - lang:name#n: `language-typescript:app.ts#10` -> name + startLine
 */
export const rehypeNunCodePre: Plugin<[], Root> = function () {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index == null) return
      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      )
      if (!code) return

      const classes = code.properties?.className
      if (!Array.isArray(classes)) return
      const langClass = classes.find(
        (c): c is string => typeof c === 'string' && c.startsWith('language-'),
      )
      if (!langClass) return

      const raw = langClass.slice('language-'.length) // e.g. "diff_typescript", "embed_html", "typescript:app.ts#10"

      // --- diff_lang ---
      if (raw.startsWith('diff_')) {
        const lang = raw.slice('diff_'.length)
        classes[classes.indexOf(langClass)] = `language-${lang}`
        ;(node as any).data = { ...((node as any).data ?? {}), diff: true }
        return
      }

      // --- embed_xxx ---
      if (raw.startsWith('embed_')) {
        const embedType = raw.slice('embed_'.length) // html | svg | mermaid | math
        node.tagName = 'nunEmbed'
        node.properties = { ...node.properties, embedType }
        return
      }

      // --- lang:name#n ---
      const colonIdx = raw.indexOf(':')
      if (colonIdx !== -1) {
        const lang = raw.slice(0, colonIdx)
        const rest = raw.slice(colonIdx + 1) // "app.ts#10" or "app.ts"
        const hashIdx = rest.indexOf('#')

        let name: string
        let startLine: number | undefined
        if (hashIdx !== -1) {
          name = rest.slice(0, hashIdx)
          startLine = parseInt(rest.slice(hashIdx + 1), 10)
          if (Number.isNaN(startLine)) startLine = undefined
        } else {
          name = rest
        }

        classes[classes.indexOf(langClass)] = `language-${lang}`
        ;(node as any).data = {
          ...((node as any).data ?? {}),
          name,
          ...(startLine != null ? { startLine } : {}),
        }
      }
    })
  }
}
