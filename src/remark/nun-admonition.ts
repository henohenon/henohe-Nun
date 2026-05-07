import type { Plugin } from 'unified'
import type { Root, Paragraph, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { DEFAULT_TITLES } from '../admonition.ts'

// 3コロン以上 + 種別名 (ネスト時は4+コロン)
const OPEN_RE = /^:{3,}([a-zA-Z]+)\s*(.*)$/
const CLOSE_RE = /^:{3,}\s*$/

export const remarkNunAdmonition: Plugin<[], Root> = function () {
  return (tree) => {
    processChildren(tree.children as RootContent[])
  }
}

/** 任意の children 列を再帰的に処理する */
function processChildren(children: RootContent[]): void {
  let i = 0

  while (i < children.length) {
    const node = children[i]

    // パターン1A: 1段落・テキストのみ (空行なし・インライン記法なし)
    if (node.type === 'paragraph' && node.children.length === 1 && node.children[0].type === 'text') {
      const text = node.children[0].value
      const lines = text.split(/\r?\n/)
      const openMatch = lines[0].match(OPEN_RE)
      if (openMatch && lines.length >= 2 && CLOSE_RE.test(lines[lines.length - 1])) {
        const bodyText = lines.slice(1, -1).join('\n')
        const admonition = buildAdmonition(openMatch, bodyText, node.position)
        children.splice(i, 1, admonition)
        i++
        continue
      }
    }

    // パターン1B: 1段落・複数children (remark-breaksによるbreak含む、またはインライン記法あり)
    // 最初のtextが開き行、最後のtextが閉じ行
    if (node.type === 'paragraph' && node.children.length >= 2) {
      const ch = node.children
      const first = ch[0]
      const last = ch[ch.length - 1]
      if (first.type === 'text' && last.type === 'text') {
        const firstLine = first.value.split('\n')[0]
        const lastLines = last.value.split('\n')
        const lastLine = lastLines[lastLines.length - 1]
        const openMatch = firstLine.match(OPEN_RE)
        if (openMatch && CLOSE_RE.test(lastLine)) {
          const firstRest = first.value.slice(firstLine.length).replace(/^\n/, '')
          const lastRest = last.value.slice(0, last.value.length - lastLine.length).replace(/\n$/, '')
          const middle = ch.slice(1, -1)

          // 全ノードがtextまたはbreak: 文字列に再構築してfromMarkdownで再パース (ネスト対応)
          if (middle.every((n: any) => n.type === 'text' || n.type === 'break')) {
            const bodyParts: string[] = []
            if (firstRest) bodyParts.push(firstRest)
            for (const n of middle as any[]) {
              if (n.type === 'text') bodyParts.push(n.value)
              else if (n.type === 'break') bodyParts.push('\n')
            }
            if (lastRest) bodyParts.push(lastRest)
            const bodyText = bodyParts.join('')
            const admonition = buildAdmonition(openMatch, bodyText, node.position)
            children.splice(i, 1, admonition)
            i++
            continue
          }

          // インライン記法あり: ノードとして包んで処理
          const innerNodes: any[] = []
          if (firstRest) innerNodes.push({ ...first, value: firstRest })
          innerNodes.push(...middle)
          if (lastRest) innerNodes.push({ ...last, value: lastRest })
          // remark-breaks が挿入する先頭・末尾の break を除去
          while (innerNodes.length > 0 && innerNodes[0].type === 'break') innerNodes.shift()
          while (innerNodes.length > 0 && innerNodes[innerNodes.length - 1].type === 'break') innerNodes.pop()
          const bodyNodes: RootContent[] = innerNodes.length > 0
            ? [{ type: 'paragraph', children: innerNodes } as any]
            : []
          const admonition = buildAdmonitionFromNodes(openMatch, bodyNodes, node.position)
          children.splice(i, 1, admonition)
          i++
          continue
        }
      }
    }

    // パターン2: 開き行が段落、閉じ行が別の段落 (空行あり)
    if (node.type === 'paragraph' && isOpenFence(node)) {
      const openMatch = getOpenMatch(node)
      if (openMatch) {
        let closeIdx = -1
        for (let j = i + 1; j < children.length; j++) {
          if (isCloseFence(children[j])) {
            closeIdx = j
            break
          }
        }
        if (closeIdx >= 0) {
          const bodyNodes = children.slice(i + 1, closeIdx) as RootContent[]
          processChildren(bodyNodes)
          const admonition = buildAdmonitionFromNodes(openMatch, bodyNodes, node.position)
          children.splice(i, closeIdx - i + 1, admonition)
          i++
          continue
        }
      }
    }

    i++
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

function buildAdmonition(match: RegExpMatchArray, bodyText: string, position: any): any {
  const [, typeName, customTitle] = match
  const bodyChildren: RootContent[] = bodyText.trim()
    ? (fromMarkdown(bodyText).children as RootContent[])
    : []
  processChildren(bodyChildren)
  return {
    type: 'nunAdmonition',
    data: {
      admonitionType: typeName,
      title: customTitle.trim() || DEFAULT_TITLES[typeName] || typeName,
    },
    children: bodyChildren,
    position,
  }
}

function buildAdmonitionFromNodes(
  match: RegExpMatchArray,
  bodyNodes: RootContent[],
  position: any,
): any {
  const [, typeName, customTitle] = match
  return {
    type: 'nunAdmonition',
    data: {
      admonitionType: typeName,
      title: customTitle.trim() || DEFAULT_TITLES[typeName] || typeName,
    },
    children: bodyNodes,
    position,
  }
}
