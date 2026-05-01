import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'
import type { Scope, VFileData, NwytProp } from '../types.ts'
import { parseNwytValue } from './templates.ts'

/**
 * section レベルの Scope にフッターを追加する。
 * !fl / !fr の nwyt prop からフッター要素を生成。
 * グローバル指定はデフォルト値として使用、ローカルが優先。
 */
export function appendFooter(
  el: Element,
  scope: Scope,
  data: VFileData,
  globalNwyts: NwytProp[],
): void {
  // ローカル → グローバルの順で検索
  const fl = findNwyt(scope.nwyts, 'fl') ?? findNwyt(globalNwyts, 'fl')
  const fr = findNwyt(scope.nwyts, 'fr') ?? findNwyt(globalNwyts, 'fr')

  // fl も fr もなければフッターなし
  if (!fl && !fr) return

  const footerChildren: ElementContent[] = []

  if (fl) {
    footerChildren.push(
      h('span.fl', { className: fl.classes }, parseNwytValue('fl', fl.rawValue))
    )
  } else {
    footerChildren.push(h('span.fl'))
  }

  footerChildren.push(h('hr'))

  if (fr) {
    footerChildren.push(
      h('span.fr', { className: fr.classes }, parseNwytValue('fr', fr.rawValue))
    )
  } else {
    footerChildren.push(h('span.fr'))
  }

  el.children.push(h('footer', footerChildren))

  // !bg: section の background-image
  const bg = findNwyt(scope.nwyts, 'bg') ?? findNwyt(globalNwyts, 'bg')
  if (bg) {
    el.properties ??= {}
    const src = extractImageSrc(bg.rawValue)
    if (src) {
      el.properties.style = `background-image: url('${src}')`
    }
  }
}

function findNwyt(nwyts: NwytProp[], key: string): NwytProp | undefined {
  return nwyts.find(n => n.key === key)
}

function extractImageSrc(raw: string): string | null {
  const match = raw.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  if (match) return match[2]
  const trimmed = raw.trim()
  return trimmed || null
}
