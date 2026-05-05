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

/** Scope に対応する 2 種類の行範囲。
 *
 * - `template`: テンプレートマーカー (`🌊name`) は heading の上に書く慣例なので、
 *   前スコープの末尾〜このスコープの heading 末尾を範囲にする。
 * - `nwyt`: nwyt prop (`!key~value`) と脚注定義 (`!fn~[id]`) は heading 直下〜次 heading 直前を範囲にする。
 *   spec (technical.md:163) の「scope 範囲 = heading の行〜次の同レベル以上 heading の行」に揃える。
 *   body の lastLine 起点だと、splice 済みの nwyt 位置が前グループの lastLine を超えた場合に
 *   次スコープへ漏れる (lead 等が前後で取り違わる) ため heading 起点が必須。
 */
type ScopeRanges = {
  template: { start: number; end: number }
  nwyt: { start: number; end: number }
}

/**
 * hast の子ノード列を指定 depth の heading で分割し、Scope ツリーを構築する。
 *
 * 再帰時には親スコープの nwyt 範囲末尾を `parentNwytEnd` として渡す。
 * 末尾サブスコープ (次の同レベル heading が無い) の nwyt 範囲が親を超えて
 * 隣スコープの定義 (例: 後続セクションの `!fn~`) を巻き込まないようにするため。
 */
export function extractScopes(
  nodes: (RootContent | ElementContent)[],
  depth: number,
  data: VFileData,
  sectionIndex: { value: number },
  parentNwytEnd: number = Number.MAX_SAFE_INTEGER,
): Scope[] {
  const groups = splitByHeading(nodes, depth)
  return groups.map((group, i) => {
    const ranges: ScopeRanges = {
      template: {
        start: i === 0 ? 0 : groups[i - 1].lastLine + 1,
        end: group.lastLine,
      },
      nwyt: {
        start: group.headingStartLine,
        end: i < groups.length - 1
          ? groups[i + 1].headingStartLine - 1
          : parentNwytEnd,
      },
    }
    return buildScope(group, depth, data, sectionIndex, ranges)
  })
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
  ranges: ScopeRanges,
): Scope {
  const tag = depth === 1 ? 'section' as const : 'article' as const

  if (tag === 'section') {
    sectionIndex.value++
  }

  // vfile.data から position ベースで template/nwyt を紐付け
  const bound = bindScopeData(data, ranges, sectionIndex.value)

  // body 内に depth+1 の heading があるか確認
  const hasSubHeadings = group.children.some(
    node => getHeadingDepth(node) === depth + 1
  )

  let body: Scope['body']
  if (hasSubHeadings && depth + 1 <= 6) {
    // 子スコープの nwyt 範囲がこのスコープを超えないよう nwyt.end を伝播
    body = extractScopes(group.children, depth + 1, data, sectionIndex, ranges.nwyt.end)
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
 * vfile.data から position ベースで template/nwyt prop / 脚注定義を Scope に紐付ける。
 * 範囲は `ScopeRanges` 参照。
 */
function bindScopeData(
  data: VFileData,
  ranges: ScopeRanges,
  pageNumber: number,
): {
  template: TemplateName
  classes: string[]
  nwyts: NwytProp[]
  fnDef?: string
} {
  const inTemplateRange = (line: number) =>
    line >= ranges.template.start && line <= ranges.template.end
  const inNwytRange = (line: number) =>
    line >= ranges.nwyt.start && line <= ranges.nwyt.end

  // テンプレート: 範囲内のもの、後勝ち
  const matchingTemplates = data.templates.filter(
    t => inTemplateRange(t.position.start.line)
  )
  const lastTemplate = matchingTemplates[matchingTemplates.length - 1]
  const template: TemplateName = lastTemplate?.template ?? 'default'
  const classes = matchingTemplates.flatMap(t => t.classes)

  // nwyt prop と脚注定義はどちらも `!key~value` 構文の派生なので同じ nwyt 範囲を使う
  const nwyts = data.nwyts.filter(n => inNwytRange(n.position.start.line))

  let fnDef: string | undefined
  for (const [id, entry] of Object.entries(data.footnotes)) {
    if (inNwytRange(entry.position.start.line)) {
      fnDef = id
      data.footnoteLocs[id] = { page: pageNumber }
      break
    }
  }

  return { template, classes, nwyts, fnDef }
}
