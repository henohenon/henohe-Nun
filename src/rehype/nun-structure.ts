import type { Root, ElementContent } from 'hast'
import type { Plugin } from 'unified'
import { extractScopes } from './extract-scopes.ts'
import { render } from './templates.ts'
import { initVFileData } from '../types.ts'
import type { VFileData, NwytProp } from '../types.ts'
import { appendBackground, appendFooter, appendFooterBackground } from './decorations/index.ts'
import { resolveFootnotes } from './resolve-footnotes.ts'
import { buildShell, defaultOgImage, defaultOgUrl } from './shell.ts'

type Options = {
  jsPath: string
  base: string
  deck: string
}

/**
 * rehype plugin: Scope 抽出 → テンプレート適用 → 装飾レイヤー → 脚注解決 →
 * ページシェルで包んで完成形 hast を作る。
 *
 * 各ステージは独立したモジュールに切り出されている:
 * - 構造化: extract-scopes / templates
 * - 装飾レイヤー: decorations/
 * - 脚注解決: resolve-footnotes
 * - シェル + OGP: shell
 */
export const rehypeNunStructure: Plugin<[Options], Root, Root> = function (options) {
  return (tree, file) => {
    // vfile.data を初期化 (Phase 5 以降で remark plugins が populate する)
    const data: VFileData = {
      ...initVFileData(),
      ...file.data as Partial<VFileData>,
    }

    const meta = data.meta

    // 1. フラット hast → Scope ツリー
    const sectionIndex = { value: 0 }
    const scopes = extractScopes(tree.children, 1, data, sectionIndex)

    // グローバル nwyt props を抽出 (最初の section heading より前の entries)
    const firstHeadingLine = scopes.find(s => s.heading)?.heading?.position?.start.line ?? Infinity
    const globalNwyts: NwytProp[] = data.nwyts.filter(
      n => n.position.start.line < firstHeadingLine,
    )

    // 2. 各 Scope を再帰的にテンプレート適用して hast 化、 section に装飾レイヤー追加
    let firstSectionMarked = false
    const sections = scopes.map((scope, i) => {
      const el = render(scope)
      const sectionId = String(i + 1)
      if (scope.tag === 'section') {
        el.properties ??= {}
        el.properties.id = sectionId
        // 1 枚目に .active を付与 (JS なしでの初期表示用)
        if (!firstSectionMarked) {
          const existing = el.properties.className as string[] | undefined
          el.properties.className = [...(existing ?? []), 'active']
          firstSectionMarked = true
        }
      }
      // 装飾レイヤー (bg / footer / fbg) を section に追加
      appendBackground(el, scope, globalNwyts)
      appendFooter(el, scope, globalNwyts, sectionId)
      appendFooterBackground(el, scope, globalNwyts, sectionId)
      return el
    })

    // 3. 脚注の一括解決: tooltip 挿入 + href 設定
    resolveFootnotes(sections, scopes, data)

    // 4. ページシェルで包む (sections は body 直下に展開、 wrapper div は使わない)
    const shell = buildShell(
      sections as ElementContent[],
      {
        title: meta.title ?? '',
        description: meta.description ?? '',
        // og:image は明示指定があれば優先、 なければ {base}{deck}/thumb.webp に自動派生
        ogImage: meta.ogImage ?? meta.image ?? defaultOgImage(options.base, options.deck),
        ogUrl: meta.url ?? defaultOgUrl(options.base, options.deck),
        jsPath: options.jsPath,
      },
    )

    tree.children = [shell]
  }
}
