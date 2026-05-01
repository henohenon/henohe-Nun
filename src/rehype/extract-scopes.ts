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
    // 行範囲: 前のグループの heading の行の次〜このグループの最後のノードの行
    // テンプレートは heading の直前に書かれるので、前のグループ終了後〜このグループ終了が範囲
    const startLine = i === 0
      ? 0
      : (groups[i - 1].lastLine + 1)
    const endLine = group.lastLine

    const scope = buildScope(group, depth, data, sectionIndex, startLine, endLine)
    scopes.push(scope)
  }

  return scopes
}

type NodeGroup = {
  heading: Element | null
  children: (RootContent | ElementContent)[]
  lastLine: number  // グループ内の最終行
}

/** ノードの最終行を取得 */
function getLastLine(node: RootContent | ElementContent): number {
  if ('position' in node && node.position) {
    return node.position.end.line
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
  let current: NodeGroup = { heading: null, children: [], lastLine: 0 }

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
): Scope {
  const tag = depth === 1 ? 'section' as const : 'article' as const

  if (tag === 'section') {
    sectionIndex.value++
  }

  // vfile.data から position ベースで template/nwyt を紐付け
  const bound = bindScopeData(data, startLine, endLine, sectionIndex.value)

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
 * startLine 〜 endLine の範囲にある entry をフィルタ。
 * グローバル指定（最初の h1 より前）は別途処理（TODO）。
 */
function bindScopeData(
  data: VFileData,
  startLine: number,
  endLine: number,
  pageNumber: number,
): {
  template: TemplateName
  classes: string[]
  nwyts: NwytProp[]
  fnDef?: string
} {
  const inRange = (line: number) => line >= startLine && line <= endLine

  // テンプレート: 範囲内のもの、後勝ち
  const matchingTemplates = data.templates.filter(
    t => inRange(t.position.start.line)
  )
  const lastTemplate = matchingTemplates[matchingTemplates.length - 1]
  const template: TemplateName = lastTemplate?.template ?? 'default'
  const classes = matchingTemplates.flatMap(t => t.classes)

  // nwyt prop: 範囲内のもの
  const nwyts = data.nwyts.filter(n => inRange(n.position.start.line))

  // 脚注定義の検出
  let fnDef: string | undefined
  for (const [id, entry] of Object.entries(data.footnotes)) {
    if (inRange(entry.position.start.line)) {
      fnDef = id
      // pageNumber は section/article 両方から呼ばれるが、同じ値なので上書きは無害
      data.footnoteLocs[id] = { page: pageNumber }
      break
    }
  }

  return { template, classes, nwyts, fnDef }
}
