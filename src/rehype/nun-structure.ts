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
import {appendBackground, appendFooterBackground} from "./background.ts";

type Options = {
  jsPath: string
  base: string
  deck: string
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
    let firstSectionMarked = false
    const sections = scopes.map((scope, i) => {
      const el = render(scope)
      const sectionId = String(i + 1);
      // section に id を付与（ナビゲーション用）
      if (scope.tag === 'section') {
        el.properties ??= {}
        el.properties.id = sectionId
        // 1 枚目に .active を付与（JS なしでの初期表示用）
        if (!firstSectionMarked) {
          const existing = el.properties.className as string[] | undefined
          el.properties.className = [...(existing ?? []), 'active']
          firstSectionMarked = true
        }

      }
      // フッター追加
      appendBackground(el, scope, globalNwyts)
      appendFooter(el, scope, globalNwyts, sectionId)
      appendFooterBackground(el, scope, globalNwyts, sectionId)
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
        // og:image は明示指定があれば優先、なければ {base}{deck}/thumb.webp に自動派生
        ogImage: meta.ogImage ?? meta.image ?? defaultOgImage(options.base, options.deck),
        ogUrl: meta.url ?? defaultOgUrl(options.base, options.deck),
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
  ogUrl: string
  jsPath: string
}

/** `{base}/{deck}/{suffix}` を組み立て。 base 末尾の `/` は剥がして二重 slash を避ける。
 *  base / deck が未設定の場合は空文字を返して呼び出し側でスキップ判定。 */
function joinDeckPath(base: string, deck: string, suffix: string): string {
  if (!base || !deck) return ''
  return `${base.replace(/\/$/, '')}/${deck}/${suffix}`
}

/** capture スクリプトが生成するサムネ画像の URL */
function defaultOgImage(base: string, deck: string): string {
  return joinDeckPath(base, deck, 'thumb.webp')
}

/** og:url と canonical link 用の deck root URL */
function defaultOgUrl(base: string, deck: string): string {
  return joinDeckPath(base, deck, '')
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
  const fnBodies = collectFnBodies(scopes, data)
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

      // tooltip: 脚注内容を <template> に詰めて隣に置く。
      // sup は <p> の中にいるため、生の block (<p> 等) を sibling に置くと
      // HTML5 adoption agency が外側 <p> を強制 close する。<template> は parse 時に
      // 別 insertion mode に切り替わるため中身がどんな block でも外側を壊さない。
      // 表示は client 側で content を clone して visible div に展開する。
      if (body && body.length > 0) {
        const tpl = h('template', { dataFn: fnId }, body)
        parent.children.splice(index + 1, 0, tpl as ElementContent)
      }
    })
  }
}

/** Scope ツリーから fnDef を持つ scope の body を再帰的に収集。
 *  `!fn.head~[id]` (head class 付き) の場合は heading も先頭に含める。 */
function collectFnBodies(scopes: Scope[], data: VFileData): Record<string, ElementContent[]> {
  const result: Record<string, ElementContent[]> = {}

  function walk(scope: Scope) {
    if (scope.fnDef) {
      const content: ElementContent[] = []
      // head class 付きなら heading を先頭に prepend
      const withHead = data.footnotes[scope.fnDef]?.classes.includes('head')
      if (withHead && scope.heading) {
        content.push(scope.heading)
      }
      // body から ElementContent のみ収集（子 Scope は展開しない）
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
    // OGP 用 + 一般的な description meta の両方を出す
    headChildren.push(h('meta', { name: 'description', content: meta.description }))
    headChildren.push(h('meta', { property: 'og:description', content: meta.description }))
  }
  // og:type は website 固定 (slide deck はサイト的位置付け)
  headChildren.push(h('meta', { property: 'og:type', content: 'website' }))
  if (meta.ogUrl) {
    headChildren.push(h('meta', { property: 'og:url', content: meta.ogUrl }))
  }
  if (meta.ogImage) {
    headChildren.push(h('meta', { property: 'og:image', content: meta.ogImage }))
    // Twitter は og:image を拾う summary_large_image を指定すれば大画像 preview
    headChildren.push(h('meta', { name: 'twitter:card', content: 'summary_large_image' }))
  }

  return h('html', { lang: 'ja' }, [
    h('head', headChildren),
    h('body', [
      content,
      h('script', { type: 'module', src: meta.jsPath }),
    ]),
  ])
}
