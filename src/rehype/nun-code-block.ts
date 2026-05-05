import type { Plugin } from 'unified'
import type { Root, Element, Text } from 'hast'
import { visit, SKIP } from 'unist-util-visit'
import { h } from 'hastscript'
import { fromHtml } from 'hast-util-from-html'
import { toString } from 'hast-util-to-string'
import katex from 'katex'

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
        case 'math': {
          const html = katex.renderToString(textContent.trim(), {
            displayMode: true,
            throwOnError: false,
          })
          const parsed = fromHtml(html, { fragment: true })
          parent.children.splice(index, 1, ...parsed.children)
          return [SKIP, index] as const
        }
        default:
          return
      }

      parent.children[index] = replacement
      return [SKIP, index] as const
    })

    // --- Pass 2: diff blocks ---
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      if (!('data-nun-diff' in (node.properties ?? {}))) return

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

      const props = node.properties ?? {}
      const lang      = props['data-nun-lang']  as string | undefined
      const name      = props['data-nun-name']  as string | undefined
      const startRaw  = props['data-nun-start'] as string | undefined
      const startLine = startRaw != null ? parseInt(startRaw, 10) : undefined

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
      return [SKIP, index + 1] as const
    })
  }
}

function getTextContent(node: Element): string {
  return toString(node)
}

function addClassName(node: Element, className: string) {
  node.properties ??= {}
  const raw = node.properties.class
  const arr = node.properties.className

  if (Array.isArray(arr)) {
    arr.push(className)
  } else if (typeof raw === 'string') {
    // Shiki emits `class: "line"` (raw string) — normalize to className array
    delete node.properties.class
    node.properties.className = raw ? [raw, className] : [className]
  } else {
    node.properties.className = [className]
  }
}
