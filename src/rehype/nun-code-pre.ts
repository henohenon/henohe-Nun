import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * rehype plugin that pre-processes code blocks before shiki.
 *
 * Metadata (lang, name, startLine, diff) is encoded into code.data.meta
 * so Shiki preserves it via meta.__raw and the nunShikiTransformer can
 * transfer it to data-nun-* attributes on the output <pre>.
 *
 * Encoding: "nun;<lang>[;name=<name>][;start=<n>][;diff]"
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

      const raw = langClass.slice('language-'.length)

      // --- embed_xxx: becomes nunEmbed, never hits Shiki ---
      if (raw.startsWith('embed_')) {
        const embedType = raw.slice('embed_'.length)
        node.tagName = 'nunEmbed'
        node.properties = { ...node.properties, embedType }
        return
      }

      // --- diff_lang ---
      if (raw.startsWith('diff_')) {
        const lang = raw.slice('diff_'.length)
        classes[classes.indexOf(langClass)] = `language-${lang}`
        setMeta(code, encodeMeta(lang, undefined, undefined, true))
        return
      }

      // --- lang:name#n ---
      const colonIdx = raw.indexOf(':')
      if (colonIdx !== -1) {
        const lang = raw.slice(0, colonIdx)
        const rest = raw.slice(colonIdx + 1)
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
        setMeta(code, encodeMeta(lang, name, startLine, false))
        return
      }

      // --- plain lang ---
      setMeta(code, encodeMeta(raw, undefined, undefined, false))
    })
  }
}

function setMeta(code: Element, meta: string) {
  code.data = { ...(code.data ?? {}), meta }
}

function encodeMeta(
  lang: string,
  name: string | undefined,
  startLine: number | undefined,
  diff: boolean,
): string {
  const parts = ['nun', lang]
  if (name) parts.push('name=' + name)
  if (startLine != null) parts.push('start=' + startLine)
  if (diff) parts.push('diff')
  return parts.join(';')
}
