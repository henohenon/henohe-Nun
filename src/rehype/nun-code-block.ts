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
    // diff-add / diff-del の class 付与 + 行頭 `+` / `-` を `.diff-marker` 化。
    // marker は CSS で `user-select: none` を当て、copy ボタン側 (extractCleanCode)
    // でも除外する → カーソル選択でも button でも prefix 文字が混入しない。
    // `\n` は触らない (剥がすと非 diff と DOM 構造が非対称になる + マウス copy
    // で改行が落ちる弊害がある)。CSS の `display: block` も使わない。
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
          extractDiffMarker(child, '+')
        } else if (lineText.startsWith('-')) {
          addClassName(child, 'diff-del')
          extractDiffMarker(child, '-')
        } else if (lineText.startsWith(' ')) {
          // unified diff の context 行 (先頭スペース 1 文字)。bg は無いが
          // 先頭スペースだけ marker 化して copy / 選択から除外する。
          extractDiffMarker(child, ' ')
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

      // Add line numbers if startLine is set.
      // 桁幅は code 全体の最大行番号で決まる: `--ln-width: <maxDigits>ch` を
      // pre に inline style で乗せて、CSS 側で `.line-number` の min-width に
      // 反映させる。これで 2 桁 / 3 桁 / 4 桁の deck で gap が均一にならず、
      // 必要最小限の幅で揃う。 */
      if (startLine != null) {
        const lineCount = code.children.filter(
          c => c.type === 'element' && c.tagName === 'span'
        ).length
        const maxLine = startLine + lineCount - 1
        const maxDigits = String(maxLine).length

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

        // 既存 style に `--ln-width: <n>ch` を追記
        const existingStyle = (node.properties?.['style'] as string | undefined) ?? ''
        node.properties ??= {}
        node.properties['style'] = `${existingStyle ? existingStyle.replace(/;?\s*$/, ';') : ''}--ln-width:${maxDigits}ch`
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

/** diff 行の先頭 `+`/`-` を探して `.diff-marker` span に分離。
 *  shiki は `-const` のように prefix を続く token と一塊にして出力するので
 *  最初の text-bearing token を見つけて 1 文字分だけ切り出す。 */
function extractDiffMarker(line: Element, marker: '+' | '-' | ' ') {
  for (let i = 0; i < line.children.length; i++) {
    const child = line.children[i]
    if (child.type !== 'element' || child.tagName !== 'span') continue
    const firstChild = child.children[0]
    if (firstChild?.type !== 'text') continue
    if (!firstChild.value.startsWith(marker)) continue

    const rest = firstChild.value.slice(1)
    const markerSpan: Element = {
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['diff-marker'],
        ...(child.properties?.['style']
          ? { style: child.properties['style'] as string }
          : {}),
      },
      children: [{ type: 'text', value: marker } as Text],
    }
    if (rest === '') {
      line.children.splice(i, 1, markerSpan)
    } else {
      firstChild.value = rest
      line.children.splice(i, 0, markerSpan)
    }
    return
  }
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
