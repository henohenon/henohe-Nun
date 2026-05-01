import type { Plugin } from 'unified'
import type { Root, Paragraph, RootContent } from 'mdast'

const DEFAULT_TITLES: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  alert: 'Alert',
}

const OPEN_RE = /^:::([a-zA-Z]+)([+-])?\s*(.*)$/
const CLOSE_RE = /^:{3,}\s*$/

/**
 * remark plugin: :::type admonition ブロックを mdast で検出し、
 * nunAdmonition ノードに変換する。
 *
 * 対応パターン:
 * - 空行なし: :::note\nBody\n::: → 1段落内のテキスト
 * - 空行あり: :::note\n\nBody\n\n::: → 複数段落
 */
export const remarkNunAdmonition: Plugin<[], Root> = function () {
  return (tree) => {
    const children = tree.children
    let i = 0

    while (i < children.length) {
      const node = children[i]

      // パターン1: 1段落に全部入っている (空行なし)
      if (node.type === 'paragraph' && node.children.length === 1 && node.children[0].type === 'text') {
        const text = node.children[0].value
        const lines = text.split(/\r?\n/)
        const openMatch = lines[0].match(OPEN_RE)
        if (openMatch && lines.length >= 2 && CLOSE_RE.test(lines[lines.length - 1])) {
          const admonition = buildAdmonition(
            openMatch,
            lines.slice(1, -1).join('\n'),
            node.position,
          )
          children.splice(i, 1, admonition as any)
          i++
          continue
        }
      }

      // パターン2: 開き行が段落、閉じ行が別の段落 (空行あり)
      if (node.type === 'paragraph' && isOpenFence(node)) {
        const openMatch = getOpenMatch(node)
        if (openMatch) {
          // 閉じ行を探す
          let closeIdx = -1
          for (let j = i + 1; j < children.length; j++) {
            if (isCloseFence(children[j])) {
              closeIdx = j
              break
            }
          }
          if (closeIdx >= 0) {
            const bodyNodes = children.slice(i + 1, closeIdx)
            const admonition = buildAdmonitionFromNodes(
              openMatch,
              bodyNodes,
              node.position,
            )
            children.splice(i, closeIdx - i + 1, admonition as any)
            i++
            continue
          }
        }
      }

      i++
    }
  }
}

function isOpenFence(node: RootContent): boolean {
  if (node.type !== 'paragraph') return false
  const p = node as Paragraph
  if (p.children.length !== 1 || p.children[0].type !== 'text') return false
  return OPEN_RE.test(p.children[0].value)
}

function getOpenMatch(node: RootContent): RegExpMatchArray | null {
  if (node.type !== 'paragraph') return null
  const p = node as Paragraph
  if (p.children.length !== 1 || p.children[0].type !== 'text') return null
  return p.children[0].value.match(OPEN_RE)
}

function isCloseFence(node: RootContent): boolean {
  if (node.type !== 'paragraph') return false
  const p = node as Paragraph
  if (p.children.length !== 1 || p.children[0].type !== 'text') return false
  return CLOSE_RE.test(p.children[0].value)
}

function buildAdmonition(
  match: RegExpMatchArray,
  bodyText: string,
  position: any,
): any {
  const [, typeName, collapse, customTitle] = match
  return {
    type: 'nunAdmonition',
    data: {
      admonitionType: typeName,
      collapse: collapse === '+' ? 'open' : collapse === '-' ? 'closed' : null,
      title: customTitle.trim() || DEFAULT_TITLES[typeName] || typeName,
    },
    children: bodyText.trim()
      ? [{ type: 'paragraph', children: [{ type: 'text', value: bodyText }] }]
      : [],
    position,
  }
}

function buildAdmonitionFromNodes(
  match: RegExpMatchArray,
  bodyNodes: RootContent[],
  position: any,
): any {
  const [, typeName, collapse, customTitle] = match
  return {
    type: 'nunAdmonition',
    data: {
      admonitionType: typeName,
      collapse: collapse === '+' ? 'open' : collapse === '-' ? 'closed' : null,
      title: customTitle.trim() || DEFAULT_TITLES[typeName] || typeName,
    },
    children: bodyNodes,
    position,
  }
}
