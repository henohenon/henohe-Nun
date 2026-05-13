import { h } from 'hastscript'
import type { Element, ElementContent, Properties, Root as HastRoot } from 'hast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeMathjax from 'rehype-mathjax/svg'
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
  .use(rehypeMathjax)

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
  // heading は stage wrapper の中に入るので、 lookup は stage.children を見る
  // (stage は template 出力の最初の child として常に存在)。
  if (scope.fnDef) {
    el.properties ??= {}
    el.properties['dataFnDef'] = scope.fnDef
    if (scope.heading) {
      const stage = el.children[0] as Element
      const idx = stage.children.indexOf(scope.heading as ElementContent)
      if (idx >= 0) {
        const clonedHeading = JSON.parse(JSON.stringify(scope.heading)) as Element
        const mark = h('span.fn-def-mark', `[^${scope.fnDef}]`)
        clonedHeading.children.unshift(mark as ElementContent)
        stage.children[idx] = clonedHeading as ElementContent
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

/** image-only nwyt keys: クラス指定を inner `<img>` に直接乗せる (span wrapper を介さない)。
 *  bg/fbg は decorations/bg.ts /fbg.ts で別経路、 ここでは template から resolveNwyt 経由で
 *  来るもののみ対象。 image utility class を `img.<class>` selector で uniform に当てるための統一。 */
const IMAGE_ONLY_NWYT_KEYS = new Set(['icon'])

/** nwyt prop を key で検索し、hast 化 */
export function resolveNwyt(scope: Scope, key: string): Element | null {
  const nwyt = scope.nwyts.find(n => n.key === key)
  if (!nwyt) return null
  const children = parseNwytValue(nwyt.key, nwyt.rawValue)

  // image-only key (icon 等): class を inner <img> に直接乗せて span wrapper を省く
  if (IMAGE_ONLY_NWYT_KEYS.has(key) && children.length === 1) {
    const first = children[0] as Element
    if (first.type === 'element' && first.tagName === 'img') {
      if (nwyt.classes.length > 0) {
        first.properties = { ...(first.properties ?? {}), className: nwyt.classes }
      }
      return first
    }
  }

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

/** var inline (escape hatch) 対応 prefix。 `!color-brand~#fff` のような nwyt key を
 *  CSS 変数 `--brand: #fff` として scope の style に流す。 spec docs/spec/syntax.md
 *  の 「var inline (escape hatch)」 節参照。 */
const VAR_INLINE_PREFIXES = new Set(['color', 'size'])

/** scope の nwyts から var inline (`<prefix>-<name>~value`) を CSS 宣言に変換。
 *  非対応 prefix や value 空のものは skip。 value 内の `;` `{` `}` は injection 防止
 *  のため除去 (CSS rule 境界破壊回避)。 */
function extractVarStyle(nwyts: NwytProp[]): string | undefined {
  const decls: string[] = []
  for (const n of nwyts) {
    const dash = n.key.indexOf('-')
    if (dash < 1) continue
    const prefix = n.key.slice(0, dash)
    if (!VAR_INLINE_PREFIXES.has(prefix)) continue
    const name = n.key.slice(dash + 1)
    if (!name) continue
    const value = (n.rawValue ?? '').replace(/[;{}]/g, '').trim()
    if (!value) continue
    decls.push(`--${name}: ${value}`)
  }
  return decls.length > 0 ? decls.join('; ') : undefined
}

/**
 * Template 出力の共通ラッパ。 全 template が `<X.template> > <div.stage> > [...]`
 * の形を取る。 stage は heading + content (+ template-specific 要素) の
 * layout 容器、 stage の sibling は section level の装飾レイヤ (footer / bg /
 * fbg) のみ。 stage は section の padding を継承し、 footer は section 端
 * (edge-to-edge) に貼る設計。
 *
 * var inline (`!color-brand~#fff` 等) は scope の style 属性に CSS 変数として
 * 反映、 CSS の cascade で配下要素に伝播する。
 */
function wrapStage(scope: Scope, templateName: string, stageChildren: ElementContent[]): Element {
  const props: Properties = { className: scope.classes }
  const style = extractVarStyle(scope.nwyts)
  if (style) props.style = style
  return h(`${scope.tag}.${templateName}`, props, [
    h('div.stage', stageChildren) as ElementContent,
  ])
}

function defaultTemplate(scope: Scope): Element {
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  if (scope.body.length > 0) {
    stage.push(h('div.content', renderBody(scope.body)))
  }
  return wrapStage(scope, 'default', stage)
}

function titleTemplate(scope: Scope): Element {
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  const sub = resolveNwyt(scope, 'sub')
  if (sub) stage.push(h('div.sub', [sub]))
  const henoheno = readHenohenoSvg()
  if (henoheno) stage.push(h('div.henoheno', [henoheno]))
  return wrapStage(scope, 'title', stage)
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
  const icon = resolveNwyt(scope, 'icon')
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  stage.push(
    h('div.container', [
      h('div.icon', icon ? [icon] : []),
      h('div.content', renderBody(scope.body)),
    ])
  )
  return wrapStage(scope, 'me', stage)
}

function messageTemplate(scope: Scope): Element {
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  if (scope.body.length > 0) {
    stage.push(h('div.content', renderBody(scope.body)))
  }
  const lead = resolveNwyt(scope, 'lead')
  if (lead) stage.push(h('div.lead', [lead]))
  return wrapStage(scope, 'message', stage)
}

function soloTemplate(scope: Scope): Element {
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  return wrapStage(scope, 'solo', stage)
}

/** compare: 左右 2 カラムで比較レイアウト。 body 配下の article (h2 単位) が
 *  順に左右の列に配置される。 典型用途は「レンダリング結果」 vs 「ソース」 の
 *  並列表示 (markdown プレビュー / コード等)。 article 数は 2 推奨だが任意 (3
 *  以上は折り返して 2 行目に流れる)。 */
function compareTemplate(scope: Scope): Element {
  const stage: ElementContent[] = []
  if (scope.heading) stage.push(scope.heading)
  if (scope.body.length > 0) {
    stage.push(h('div.content', renderBody(scope.body)))
  }
  return wrapStage(scope, 'compare', stage)
}
