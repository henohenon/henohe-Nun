import { h } from 'hastscript'
import type { Element, ElementContent } from 'hast'



export type ShellMeta = {
  title: string
  description: string
  ogImage: string
  ogUrl: string
  jsPath: string
}

/** `{base}/{deck}/{suffix}` を組み立て。 base 末尾の `/` は剥がして二重 slash を
 *  避ける。 base / deck が未設定の場合は空文字を返して呼び出し側でスキップ判定。 */
export function joinDeckPath(base: string, deck: string, suffix: string): string {
  if (!base || !deck) return ''
  return `${base.replace(/\/$/, '')}/${deck}/${suffix}`
}

/** capture スクリプトが生成するサムネ画像の URL */
export function defaultOgImage(base: string, deck: string): string {
  return joinDeckPath(base, deck, 'thumb.webp')
}

/** og:url と canonical link 用の deck root URL */
export function defaultOgUrl(base: string, deck: string): string {
  return joinDeckPath(base, deck, '')
}

/**
 * `<html><head>...</head><body>{...sections}<script>...</script></body></html>` を
 * 組み立てる。 OGP / twitter card meta は meta が存在する時だけ出す。
 *
 * sections は body の直接の子として展開される (wrapper div は使わない)。
 * cqmin の container baseline は section 自身の `container-type: size` に
 * 任せる。
 */
export function buildShell(sections: ElementContent[], meta: ShellMeta): Element {
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
      ...sections,
      h('script', { type: 'module', src: meta.jsPath }),
    ]),
  ])
}
