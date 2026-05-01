import type { Element, ElementContent, RootContent } from 'hast'
import type { Scope, VFileData, TemplateName } from '../types.ts'

const headingDepth: Record<string, number> = {
  h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6,
}

function isElement(node: RootContent | ElementContent): node is Element {
  return node.type === 'element'
}

function getHeadingDepth(node: RootContent | ElementContent): number | null {
  if (!isElement(node)) return null
  return headingDepth[node.tagName] ?? null
}

function isEmptyHeading(node: Element): boolean {
  return node.children.length === 0
    || node.children.every(c =>
      c.type === 'text' && c.value.trim() === ''
    )
}

/** ノード列に意味のあるコンテンツがあるか（空白テキストのみなら false） */
function hasContent(nodes: (RootContent | ElementContent)[]): boolean {
  return nodes.some(node => {
    if (node.type === 'text') return node.value.trim() !== ''
    return true
  })
}

/**
 * hast の子ノード列を指定 depth の heading で分割し、Scope ツリーを構築する。
 */
export function extractScopes(
  nodes: (RootContent | ElementContent)[],
  depth: number,
  data: VFileData,
  sectionIndex: { value: number },
): Scope[] {
  const groups = splitByHeading(nodes, depth)
  const scopes: Scope[] = []

  for (const group of groups) {
    const scope = buildScope(group, depth, data, sectionIndex)
    scopes.push(scope)
  }

  return scopes
}

type NodeGroup = {
  heading: Element | null
  children: (RootContent | ElementContent)[]
}

/**
 * ノード列を指定 depth の heading で分割する。
 * heading 前のコンテンツは heading: null のグループになる。
 */
function splitByHeading(
  nodes: (RootContent | ElementContent)[],
  depth: number,
): NodeGroup[] {
  const groups: NodeGroup[] = []
  let current: NodeGroup = { heading: null, children: [] }

  for (const node of nodes) {
    const d = getHeadingDepth(node)
    if (d === depth) {
      // 現在のグループを確定（中身がある場合のみ）
      if (current.heading !== null || hasContent(current.children)) {
        groups.push(current)
      }
      // 新しいグループ開始
      const heading = isEmptyHeading(node as Element)
        ? null  // 空白 heading は区切りとして機能するが heading 要素は生成しない
        : node as Element
      current = { heading, children: [] }
    } else {
      current.children.push(node)
    }
  }

  // 最後のグループを確定
  if (current.heading !== null || hasContent(current.children)) {
    groups.push(current)
  }

  return groups
}

/**
 * NodeGroup から Scope を構築する。
 * body 内に depth+1 の heading があれば再帰的に分割する。
 */
function buildScope(
  group: NodeGroup,
  depth: number,
  data: VFileData,
  sectionIndex: { value: number },
): Scope {
  const tag = depth === 1 ? 'section' as const : 'article' as const

  if (tag === 'section') {
    sectionIndex.value++
  }

  // TODO Phase 5: vfile.data から position ベースで template/nwyt を紐付け
  const template: TemplateName = 'default'
  const classes: string[] = []
  const nwyts = [] as Scope['nwyts']

  // body 内に depth+1 の heading があるか確認
  const hasSubHeadings = group.children.some(
    node => getHeadingDepth(node) === depth + 1
  )

  let body: Scope['body']
  if (hasSubHeadings && depth + 1 <= 6) {
    // 再帰的に子 Scope を構築
    body = buildMixedBody(group.children, depth + 1, data, sectionIndex)
  } else {
    body = group.children as ElementContent[]
  }

  return {
    tag,
    depth,
    heading: group.heading,
    template,
    classes,
    nwyts,
    body,
  }
}

/**
 * hast ノードと子 Scope が混在する body を構築する。
 * depth の heading で分割し、heading 間のノードはそのまま残す。
 */
function buildMixedBody(
  nodes: (RootContent | ElementContent)[],
  depth: number,
  data: VFileData,
  sectionIndex: { value: number },
): (ElementContent | Scope)[] {
  const childScopes = extractScopes(nodes, depth, data, sectionIndex)
  // extractScopes が全ノードを Scope として返す
  // heading 前のコンテンツは implicit article (heading: null) として含まれる
  return childScopes
}
