import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { Scope, NwytProp } from '../types.ts'
import { isScope } from '../types.ts'

export type TemplateFn = (scope: Scope) => Element

export const templates: Record<string, TemplateFn> = {
  default: defaultTemplate,
  title: titleTemplate,
  me: meTemplate,
  message: messageTemplate,
  solo: soloTemplate,
}

/** Scope を再帰的にテンプレート適用して hast に変換 */
export function render(scope: Scope): Element {
  const templateFn = templates[scope.template]
  const el = templateFn(scope)

  // 脚注定義: article に data-fn-def 属性、heading に [^id] マークを追加
  if (scope.fnDef) {
    el.properties ??= {}
    el.properties['dataFnDef'] = scope.fnDef
    if (scope.heading) {
      const mark = h('span.fn-def-mark', `[^${scope.fnDef}]`)
      scope.heading.children.unshift(mark as ElementContent)
    }
  }

  return el
}

/** body 内の要素を処理。子 Scope があれば再帰、hast ノードはそのまま */
export function renderChildren(body: (ElementContent | Scope)[]): (Element | ElementContent)[] {
  return body.map(child =>
    isScope(child) ? render(child) : child
  )
}

/** nwyt prop を key で検索し、hast 化 */
export function resolveNwyt(scope: Scope, key: string): Element | null {
  const nwyt = scope.nwyts.find(n => n.key === key)
  if (!nwyt) return null
  const children = parseNwytValue(nwyt.key, nwyt.rawValue)
  return h('span', { className: nwyt.classes }, children)
}

/** rawValue を key に応じてパース */
export function parseNwytValue(key: string, raw: string): ElementContent[] {
  // bg, fbg, icon: Markdown 画像記法としてパース → img 要素
  if (key === 'bg' || key === 'fbg' || key === 'icon') {
    // 画像パス or Markdown 画像記法
    const imgMatch = raw.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    if (imgMatch) {
      return [h('img', { src: imgMatch[2], alt: imgMatch[1] }) as ElementContent]
    }
    // 素のパスとして扱う
    return [h('img', { src: raw.trim(), alt: '' }) as ElementContent]
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
  const processor = unified().use(remarkParse).use(remarkRehype)
  const mdast = processor.parse(raw)
  const hast = processor.runSync(mdast)
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
    children.push(h('div.body', renderChildren(scope.body)))
  }
  return h(`${scope.tag}.default`, { className: scope.classes }, children)
}

function titleTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const sub = resolveNwyt(scope, 'sub')
  if (sub) children.push(h('div.sub', [sub]))
  children.push(h('img.logo', { src: '/henoheno.svg', alt: '' }))
  return h(`${scope.tag}.title`, { className: scope.classes }, children)
}

function meTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  const icon = resolveNwyt(scope, 'icon')
  children.push(
    h('div.container', [
      h('div.icon', icon ? [icon] : []),
      h('div.body', renderChildren(scope.body)),
    ])
  )
  return h(`${scope.tag}.me`, { className: scope.classes }, children)
}

function messageTemplate(scope: Scope): Element {
  const children: ElementContent[] = []
  if (scope.heading) children.push(scope.heading)
  if (scope.body.length > 0) {
    children.push(h('div.body', renderChildren(scope.body)))
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
