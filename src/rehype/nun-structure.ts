import { h } from 'hastscript'
import type { Root, Element, ElementContent } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { extractScopes } from './extract-scopes.ts'
import { render } from './templates.ts'
import { appendFooter } from './footer.ts'
import { initVFileData } from '../types.ts'
import type { VFileData, NwytProp, Scope } from '../types.ts'
import { isScope } from '../types.ts'

type Options = {
  jsPath: string
}

/**
 * rehype plugin: Scope 抽出 → テンプレート適用 → ページシェル
 *
 * フラット hast を heading で構造化し、テンプレートを適用して
 * 完全な HTML ドキュメントに変換する。
 */
export const rehypeNunStructure: Plugin<[Options], Root, Root> = function (options) {
  return (tree, file) => {
    // vfile.data を初期化（Phase 5 以降で remark plugins が populate する）
    const data: VFileData = {
      ...initVFileData(),
      ...file.data as Partial<VFileData>,
    }

    const meta = data.meta

    // 1. フラット hast → Scope ツリー
    const sectionIndex = { value: 0 }
    const scopes = extractScopes(tree.children, 1, data, sectionIndex)

    // グローバル nwyt props を抽出（最初の section heading より前の entries）
    const firstHeadingLine = scopes.find(s => s.heading)?.heading?.position?.start.line ?? Infinity
    const globalNwyts: NwytProp[] = data.nwyts.filter(
      n => n.position.start.line < firstHeadingLine
    )

    // 2. 各 Scope を再帰的にテンプレート適用して hast 化
    const sections = scopes.map((scope, i) => {
      const el = render(scope)
      // section に id を付与（ナビゲーション用）
      if (scope.tag === 'section') {
        el.properties ??= {}
        el.properties.id = String(i + 1)
        // フッター追加
        appendFooter(el, scope, data, globalNwyts)
      }
      return el
    })

    // 3. 脚注の一括解決: tooltip 挿入 + href 設定
    resolveFootnotes(sections, scopes, data)

    // 4. ページシェルで包む
    const shell = buildShell(
      h('div.slides', sections as ElementContent[]),
      {
        title: meta.title ?? '',
        description: meta.description ?? '',
        ogImage: meta.ogImage ?? '',
        jsPath: options.jsPath,
      }
    )

    // tree を shell で置き換え
    tree.children = [shell]
  }
}

type ShellMeta = {
  title: string
  description: string
  ogImage: string
  jsPath: string
}

/**
 * 脚注参照 (sup[data-fn]) に tooltip と href を設定する。
 *
 * 1. scopes から fnDef article の body を収集
 * 2. sections 内の sup[data-fn] を走査
 * 3. 各参照に tooltip (hidden span) を挿入し、定義ページへの href を設定
 */
function resolveFootnotes(
  sections: Element[],
  scopes: Scope[],
  data: VFileData,
): void {
  // fnDef article の body コンテンツを id → Element[] で収集
  const fnBodies = collectFnBodies(scopes)
  if (Object.keys(fnBodies).length === 0) return

  for (const section of sections) {
    visit(section, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return
      if (node.tagName !== 'sup') return
      const fnId = node.properties?.['dataFn'] as string | undefined
      if (!fnId) return

      const loc = data.footnoteLocs[fnId]
      const body = fnBodies[fnId]

      // href: 定義ページへのリンク
      if (loc) {
        const link = h('a', { href: `#${loc.page}` }, [...node.children])
        node.children = [link as ElementContent]
      }

      // tooltip: 脚注内容の hidden 要素
      if (body && body.length > 0) {
        const tooltip = h('span.fn-tooltip', { hidden: true }, body)
        parent.children.splice(index + 1, 0, tooltip as ElementContent)
      }
    })
  }
}

/** Scope ツリーから fnDef を持つ article の body を再帰的に収集 */
function collectFnBodies(scopes: Scope[]): Record<string, ElementContent[]> {
  const result: Record<string, ElementContent[]> = {}

  function walk(scope: Scope) {
    if (scope.fnDef) {
      // body から ElementContent のみ収集（子 Scope は展開しない）
      const content: ElementContent[] = []
      for (const child of scope.body) {
        if (!isScope(child)) {
          content.push(child)
        }
      }
      result[scope.fnDef] = content
    }
    // 子 Scope を再帰走査
    for (const child of scope.body) {
      if (isScope(child)) walk(child)
    }
  }

  for (const scope of scopes) walk(scope)
  return result
}

function buildShell(content: Element, meta: ShellMeta): Element {
  const headChildren: ElementContent[] = [
    h('meta', { charset: 'utf-8' }),
    h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
  ]

  if (meta.title) {
    headChildren.push(h('title', meta.title))
    headChildren.push(h('meta', { property: 'og:title', content: meta.title }))
  }
  if (meta.description) {
    headChildren.push(h('meta', { property: 'og:description', content: meta.description }))
  }
  if (meta.ogImage) {
    headChildren.push(h('meta', { property: 'og:image', content: meta.ogImage }))
  }

  return h('html', { lang: 'ja' }, [
    h('head', headChildren),
    h('body', [
      content,
      h('script', { type: 'module', src: meta.jsPath }),
    ]),
  ])
}
