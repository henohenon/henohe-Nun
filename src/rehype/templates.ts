import { h } from 'hastscript'
import type { Element, ElementContent, Properties, Root as HastRoot } from 'hast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import { fromHtml } from 'hast-util-from-html'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Scope, NwytProp, TemplateName } from '../types.ts'
import { isScope } from '../types.ts'
import { parseImageNwytValue } from './nwyt-helpers.ts'

// 本体パイプラインと同じ拡張セットで lead/sub/fl/fr のインライン記法を処理する。
// インライン抽出 (root > p > children) で block 系は捨てられるので、
// table/codeblock 等が混ざっても害はなく、strikethrough・autolink・$math$ が効く。
const inlineProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)

export type TemplateFn = (scope: Scope) => Element

export const templates: Record<TemplateName, TemplateFn> = {
  default: defaultTemplate,
  title: titleTemplate,
  me: meTemplate,
  message: messageTemplate,
  solo: soloTemplate,
  compare: compareTemplate,
}

/** Scope を再帰的にテンプレート適用して hast に変換 */
export function render(scope: Scope): Element {
  const templateFn = templates[scope.template]
  const el = templateFn(scope)

  // 脚注定義: article に data-fn-def 属性、 heading に [^id] マークを追加。
  // heading 要素は collectFnBodies (resolve-footnotes.ts) からも tooltip 用に
  // 参照されるため、 直接 mutate せず clone した複製を template 出力 (el)
  // 側で差し替えて、 tooltip 側には素の heading を残す。
  if (scope.fnDef) {
    el.properties ??= {}
    el.properties['dataFnDef'] = scope.fnDef
    if (scope.heading) {
      const idx = el.children.indexOf(scope.heading as ElementContent)
      if (idx >= 0) {
        const clonedHeading = JSON.parse(JSON.stringify(scope.heading)) as Element
        const mark = h('span.fn-def-mark', `[^${scope.fnDef}]`)
        clonedHeading.children.unshift(mark as ElementContent)
        el.children[idx] = clonedHeading as ElementContent
      }
    }
  }

  return el
}

/** body 内の要素を処理。子 Scope があれば再帰、hast ノードはそのまま */
export function renderBody(body: (ElementContent | Scope)[]): (Element | ElementContent)[] {
  return body.map(child =>
    isScope(child) ? render(child) : child
  )
}

/** nwyt prop を key で検索し、hast 化 */
export function resolveNwyt(scope: Scope, key: string): Element | null {
  const nwyt = scope.nwyts.find(n => n.key === key)
  if (!nwyt) return null
  const children = parseNwytValue(nwyt.key, nwyt.rawValue)
  // クラス未指定時は class="" を出さない
  const props: Properties = nwyt.classes.length > 0 ? { className: nwyt.classes } : {}
  return h('span', props, children)
}

/** rawValue を key に応じてパース */
export function parseNwytValue(key: string, raw: string): ElementContent[] {
  // bg, fbg, icon: 画像として扱う (parseImageNwytValue が `[alt](url)` /
  // `![alt](url)` / 素のパスを受け付ける、 詳細は nwyt-helpers.ts)
  if (key === 'bg' || key === 'fbg' || key === 'icon') {
    const parsed = parseImageNwytValue(raw) ?? { src: '', alt: '' }
    return [h('img', parsed) as ElementContent]
  }

  // fl, fr, sub, lead: Markdown インラインとしてパース
  if (key === 'fl' || key === 'fr' || key === 'sub' || key === 'lead') {
    return parseInlineMarkdown(raw)
  }

  // その他: プレーンテキスト
  return [{ type: 'text', value: raw }]
}

/** Markdown インラインをパースして hast children を返す */
function parseInlineMarkdown(raw: string): ElementContent[] {
  const mdast = inlineProcessor.parse(raw)
  const hast = inlineProcessor.runSync(mdast)
  // root > p > children を取り出す
  const root = hast as any
  if (root.children?.[0]?.tagName === 'p') {
    return root.children[0].children as ElementContent[]
  }
  return root.children as ElementContent[] ?? [{ type: 'text', value: raw }]
}

function defaultTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderBody(scope.body)))
  }
  return h(`${scope.tag}.default`, { className: scope.classes }, children)
}

function titleTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const sub = resolveNwyt(scope, 'sub')
  if (sub) children.push(h('div.sub', [sub]))
  const henoheno = readHenohenoSvg()
  if (henoheno) children.push(h('div.henoheno', [henoheno]))
  return h(`${scope.tag}.title`, { className: scope.classes }, children)
}

// ---------------------------------------------------------------------------
// henoheno SVG inlining
// ---------------------------------------------------------------------------

/**
 * `public/henoheno.svg` を読んで SVG element として返す。 inline 化することで
 * SVG 内 `currentColor` 使用 path に CSS の `color: var(--brand)` を効かせて
 * ブランドカラーで塗れるようにする (`<img>` 参照だと CSS が SVG 内部に届かない)。
 *
 * mtime を見て差分時のみ再読 + 再パース、 同一ビルド内では cache から返す。
 */
const HENOHENO_PATH = resolve('public/henoheno.svg')
let henohenoCache: { mtimeMs: number; element: Element } | null = null

function readHenohenoSvg(): Element | null {
  try {
    const stat = statSync(HENOHENO_PATH)
    if (henohenoCache && henohenoCache.mtimeMs === stat.mtimeMs) {
      return henohenoCache.element
    }
    const content = readFileSync(HENOHENO_PATH, 'utf-8')
    const tree = fromHtml(content, { fragment: true }) as HastRoot
    const svg = tree.children.find(
      (c): c is Element => c.type === 'element' && c.tagName === 'svg',
    )
    if (!svg) return null
    // role="img" + aria-label で意味を保ちつつ、 子の `<title>` 等は不要
    svg.properties = {
      ...svg.properties,
      role: 'img',
      'aria-label': '巨大なへのへのもへじ',
    }
    henohenoCache = { mtimeMs: stat.mtimeMs, element: svg }
    return svg
  } catch {
    return null
  }
}

function meTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const icon = resolveNwyt(scope, 'icon')
  children.push(
    h('div.container', [
      h('div.icon', icon ? [icon] : []),
      h('div.body', renderBody(scope.body)),
    ])
  )
  return h(`${scope.tag}.me`, { className: scope.classes }, children)
}

function messageTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderBody(scope.body)))
  }
  const lead = resolveNwyt(scope, 'lead')
  if (lead) children.push(h('div.lead', [lead]))
  return h(`${scope.tag}.message`, { className: scope.classes }, children)
}

function soloTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  return h(`${scope.tag}.solo`, { className: scope.classes }, children)
}

/** compare: 左右 2 カラムで比較レイアウト。 body 配下の article (h2 単位) が
 *  順に左右の列に配置される。 典型用途は「レンダリング結果」 vs 「ソース」 の
 *  並列表示 (markdown プレビュー / コード等)。 article 数は 2 推奨だが任意 (3
 *  以上は折り返して 2 行目に流れる)。 */
function compareTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderBody(scope.body)))
  }
  return h(`${scope.tag}.compare`, { className: scope.classes }, children)
}
