import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import { visit } from 'unist-util-visit'
import type { VFileData, Scope } from '../types.ts'
import { isScope } from '../types.ts'

/**
 * 脚注参照 (`<sup data-fn>`) に tooltip と href を後付けする。
 *
 * 1. scopes から fnDef を持つ Scope の body を id → ElementContent[] で収集
 * 2. sections 内の `<sup data-fn>` を走査
 * 3. 各参照に
 *    - href: 定義ページへのリンク (`#<page>`)
 *    - tooltip: 脚注内容を `<template data-fn>` に詰めて sibling 配置
 *    を施す
 *
 * `<template>` を sibling に置く理由: `<sup>` は `<p>` の中にいて、 生の block
 * (`<p>` / `<div>` 等) を sibling に置くと HTML5 adoption agency が外側 `<p>` を
 * 強制 close してしまう。 `<template>` は parse 時に別 insertion mode に切り
 * 替わるため中身がどんな block でも外側 `<p>` を壊さない。 表示は client 側で
 * `template.content` を clone して `<sup>` 内の visible `<div>` に展開する
 * (client/tooltip.ts)。
 */
export function resolveFootnotes(
  sections: Element[],
  scopes: Scope[],
  data: VFileData,
): void {
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

      if (loc) {
        const link = h('a', { href: `#${loc.page}` }, [...node.children])
        node.children = [link as ElementContent]
      }

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
      // body から ElementContent のみ収集 (子 Scope は展開しない)
      for (const child of scope.body) {
        if (!isScope(child)) {
          content.push(child)
        }
      }
      result[scope.fnDef] = content
    }
    for (const child of scope.body) {
      if (isScope(child)) walk(child)
    }
  }

  for (const scope of scopes) walk(scope)
  return result
}
