import type { Element, ElementContent, RootContent } from 'hast'
import type { Scope, VFileData, TemplateName, TemplateEntry, NwytProp } from '../types.ts'

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

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    const startLine = i === 0
      ? 0
      : (groups[i - 1].lastLine + 1)
    const endLine = group.lastLine

    // nwyt props は heading より後の行に書かれるため、hast の lastLine だけでは
    // body が空のスコープで range 外になる。次のグループの heading 直前まで延ばす。
    const nwytEndLine = i < groups.length - 1
      ? groups[i + 1].headingStartLine - 1
      : Number.MAX_SAFE_INTEGER

    const scope = buildScope(group, depth, data, sectionIndex, startLine, endLine, nwytEndLine)
    scopes.push(scope)
  }

  return scopes
}

type NodeGroup = {
  heading: Element | null
  headingStartLine: number  // heading 要素の開始行（空 heading でも保持）
  children: (RootContent | ElementContent)[]
  lastLine: number
}

/** ノードの最終行を取得 */
function getLastLine(node: RootContent | ElementContent): number {
  if ('position' in node && node.position) {
    return node.position.end.line
  }
  return 0
}

/** ノードの開始行を取得 */
function getStartLine(node: RootContent | ElementContent): number {
  if ('position' in node && node.position) {
    return node.position.start.line
  }
  return 0
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
  let current: NodeGroup = { heading: null, headingStartLine: 0, children: [], lastLine: 0 }

  for (const node of nodes) {
    const d = getHeadingDepth(node)
    if (d === depth) {
      if (current.heading !== null || hasContent(current.children)) {
        groups.push(current)
      }
      const heading = isEmptyHeading(node as Element)
        ? null
        : node as Element
      current = {
        heading,
        headingStartLine: getStartLine(node),
        children: [],
        lastLine: getLastLine(node),
      }
    } else {
      current.children.push(node)
      const line = getLastLine(node)
      if (line > current.lastLine) current.lastLine = line
    }
  }

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
  startLine: number,
  endLine: number,
  nwytEndLine: number,
): Scope {
  const tag = depth === 1 ? 'section' as const : 'article' as const

  if (tag === 'section') {
    sectionIndex.value++
  }

  // vfile.data から position ベースで template/nwyt を紐付け
  const bound = bindScopeData(data, startLine, endLine, nwytEndLine, sectionIndex.value)

  // body 内に depth+1 の heading があるか確認
  const hasSubHeadings = group.children.some(
    node => getHeadingDepth(node) === depth + 1
  )

  let body: Scope['body']
  if (hasSubHeadings && depth + 1 <= 6) {
    body = extractScopes(group.children, depth + 1, data, sectionIndex)
  } else {
    body = group.children as ElementContent[]
  }

  const scope: Scope = {
    tag,
    depth,
    heading: group.heading,
    template: bound.template,
    classes: bound.classes,
    nwyts: bound.nwyts,
    body,
  }
  // fnDef は article レベルのみ（section には付けない）
  if (bound.fnDef && tag === 'article') scope.fnDef = bound.fnDef
  return scope
}

/**
 * vfile.data から position ベースで template/nwyt prop を Scope に紐付ける。
 *
 * - template: startLine〜endLine（strict）でマッチ。template marker は heading の直前に書く。
 * - nwyt prop:  startLine〜nwytEndLine（relaxed）でマッチ。prop は heading の直後に書けるため
 *               hast の lastLine を超えることがある。
 */
function bindScopeData(
  data: VFileData,
  startLine: number,
  endLine: number,
  nwytEndLine: number,
  pageNumber: number,
): {
  template: TemplateName
  classes: string[]
  nwyts: NwytProp[]
  fnDef?: string
} {
  const inRange = (line: number) => line >= startLine && line <= endLine
  const inNwytRange = (line: number) => line >= startLine && line <= nwytEndLine

  // テンプレート: 範囲内のもの、後勝ち
  const matchingTemplates = data.templates.filter(
    t => inRange(t.position.start.line)
  )
  const lastTemplate = matchingTemplates[matchingTemplates.length - 1]
  const template: TemplateName = lastTemplate?.template ?? 'default'
  const classes = matchingTemplates.flatMap(t => t.classes)

  // nwyt prop: nwyt 用の広い範囲でマッチ
  const nwyts = data.nwyts.filter(n => inNwytRange(n.position.start.line))

  // 脚注定義の検出（fnDef は article 内に本文を持つため strict range で十分）
  let fnDef: string | undefined
  for (const [id, entry] of Object.entries(data.footnotes)) {
    if (inRange(entry.position.start.line)) {
      fnDef = id
      data.footnoteLocs[id] = { page: pageNumber }
      break
    }
  }

  return { template, classes, nwyts, fnDef }
}
