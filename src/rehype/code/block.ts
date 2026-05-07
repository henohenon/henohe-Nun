import type { Plugin } from 'unified'
import type { Root, Element, Text } from 'hast'
import { visit, SKIP } from 'unist-util-visit'
import { h } from 'hastscript'
import { fromHtml } from 'hast-util-from-html'
import { toString } from 'hast-util-to-string'
import katex from 'katex'

/** copy ボタンの初期表示ラベル。 client/copy.ts は click 時に "copied" に
 *  差し替え、 1.5 秒後にこの初期値に戻す。 */
const COPY_LABEL = 'copy'

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

      if (startLine != null) {
        const maxDigits = addLineNumbers(code, startLine)
        setLineNumberWidth(node, maxDigits)
      }

      parent.children[index] = wrapInFigure(node, lang, name)
      return [SKIP, index + 1] as const
    })
  }
}

/**
 * 各 `.line` span の先頭に `<span.line-number>` を挿入し、 表示行番号を付与する。
 * 戻り値は最大行番号の桁数 (line-number 最小幅計算で利用)。
 */
function addLineNumbers(code: Element, startLine: number): number {
  const lineCount = code.children.filter(
    c => c.type === 'element' && c.tagName === 'span',
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

  return maxDigits
}

/**
 * `<pre>` の inline style に `--ln-width: <maxDigits>ch` を追記する。
 *
 * CSS 側で `.line-number` の min-width に反映され、 2 / 3 / 4 桁の deck でも
 * gap が均一にならず必要最小限の幅で揃う。 既存 style は保持する。
 */
function setLineNumberWidth(pre: Element, maxDigits: number) {
  const existing = (pre.properties?.['style'] as string | undefined) ?? ''
  const prefix = existing ? existing.replace(/;?\s*$/, ';') : ''
  pre.properties ??= {}
  pre.properties['style'] = `${prefix}--ln-width:${maxDigits}ch`
}

/** `<pre>` を `<figure class="code-block">` で wrap し、 figcaption に lang / copy ボタンを付与 */
function wrapInFigure(pre: Element, lang: string | undefined, name: string | undefined): Element {
  return h('figure.code-block', [
    h('figcaption', [
      h('span.lang', name ?? lang ?? ''),
      h('button.copy', COPY_LABEL),
    ]),
    pre,
  ])
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
