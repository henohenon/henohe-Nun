import type { Plugin } from 'unified'
import type { Root, Element, Text } from 'hast'
import { visit, SKIP } from 'unist-util-visit'
import { h } from 'hastscript'
import { fromHtml } from 'hast-util-from-html'
import { toString } from 'hast-util-to-string'

/**
 * rehype plugin that post-processes code blocks after shiki.
 *
 * Handles:
 * - embed nodes (nunEmbed) -> parsed HTML/SVG, mermaid, math
 * - diff blocks -> add diff-add / diff-del classes to line spans
 * - normal code blocks -> wrap in figure.code-block with figcaption
 */
export const rehypeNunCodeBlock: Plugin<[], Root> = function () {
  return (tree: Root) => {
    // --- Pass 1: embed nodes ---
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'nunEmbed' || !parent || index == null) return

      const embedType = node.properties?.embedType as string | undefined
      if (!embedType) return

      const textContent = getTextContent(node)

      let replacement: Element
      switch (embedType) {
        case 'html':
        case 'svg': {
          const parsed = fromHtml(textContent, { fragment: true })
          // Replace nunEmbed with parsed fragment children
          parent.children.splice(index, 1, ...parsed.children)
          return [SKIP, index] as const
        }
        case 'mermaid':
          replacement = h('pre.mermaid', textContent)
          break
        case 'math':
          replacement = h('div.math-display', textContent)
          break
        default:
          return
      }

      parent.children[index] = replacement
      return [SKIP, index] as const
    })

    // --- Pass 2: diff blocks ---
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      if (!(node as any).data?.diff) return

      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      )
      if (!code) return

      for (const child of code.children) {
        if (child.type !== 'element' || child.tagName !== 'span') continue
        const lineText = getTextContent(child)
        if (lineText.startsWith('+')) {
          addClassName(child, 'diff-add')
        } else if (lineText.startsWith('-')) {
          addClassName(child, 'diff-del')
        }
      }
    })

    // --- Pass 3: wrap normal code blocks in figure ---
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index == null) return

      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      )
      if (!code) return

      const data = (node as any).data as
        | { name?: string; startLine?: number }
        | undefined
      const name = data?.name
      const startLine = data?.startLine

      // Determine lang from code className
      const classes = code.properties?.className
      let lang: string | undefined
      if (Array.isArray(classes)) {
        const langClass = classes.find(
          (c): c is string =>
            typeof c === 'string' && c.startsWith('language-'),
        )
        if (langClass) lang = langClass.slice('language-'.length)
      }

      // Add line numbers if startLine is set
      if (startLine != null) {
        let lineNum = startLine
        for (const child of code.children) {
          if (child.type === 'element' && child.tagName === 'span') {
            const lineNumberSpan: Element = {
              type: 'element',
              tagName: 'span',
              properties: { className: ['line-number'] },
              children: [{ type: 'text', value: String(lineNum) } as Text],
            }
            child.children.unshift(lineNumberSpan)
            lineNum++
          }
        }
      }

      const figure = h('figure.code-block', [
        h('figcaption', [
          h('span.lang', name ?? lang ?? ''),
          h('button.copy', 'copy'),
        ]),
        node,
      ])

      parent.children[index] = figure
      return [SKIP, index] as const
    })
  }
}

function getTextContent(node: Element): string {
  return toString(node)
}

function addClassName(node: Element, className: string) {
  const existing = node.properties?.className
  if (Array.isArray(existing)) {
    existing.push(className)
  } else {
    node.properties = { ...node.properties, className: [className] }
  }
}
