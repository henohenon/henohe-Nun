import { h } from 'hastscript'
import type { Root, Element, ElementContent } from 'hast'
import type { Plugin } from 'unified'
import { extractScopes } from './extract-scopes.ts'
import { render } from './templates.ts'
import { initVFileData } from '../types.ts'
import type { VFileData } from '../types.ts'

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

    // 2. 各 Scope を再帰的にテンプレート適用して hast 化
    const sections = scopes.map((scope, i) => {
      const el = render(scope)
      // section に id を付与（ナビゲーション用）
      if (scope.tag === 'section') {
        el.properties ??= {}
        el.properties.id = String(i + 1)
      }
      // TODO Phase 9: section レベルならフッター追加
      return el
    })

    // 3. TODO Phase 10: 脚注の一括解決

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
