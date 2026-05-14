import type { State, Handler } from 'mdast-util-to-hast'
import { h } from 'hastscript'
import type { Element, Properties } from 'hast'
import { extractImageStyles } from '../image-style-hoist.ts'

/**
 * remark-rehype handlers for custom mdast node types.
 * Pass these as the `handlers` option to remarkRehype.
 */
export const nunHandlers: Record<string, Handler> = {
  nunMark(state: State, node: any): Element {
    return h('mark', state.all(node))
  },

  nwytContent(state: State, node: any): Element {
    const { key, classes, url } = node.data ?? {}
    // key 省略形 (`!.class[alt](url)`) は class 付き <img> として出力する。
    // alt は children 先頭のテキスト value、 src は url。
    if (!key && url) {
      const alt = (node.children?.[0] as any)?.value ?? ''
      const { classes: cls, style } = extractImageStyles(classes ?? [])
      const props: Properties = { src: url, alt }
      if (cls.length > 0) props.className = cls
      if (style) props.style = style
      return h('img', props)
    }
    const children = state.all(node)
    const classNames = ['nwyt-' + (key ?? 'unknown'), ...(classes ?? [])]
    const props: Record<string, string> = { 'data-nwyt': key ?? '' }
    if (url) props['data-nwyt-url'] = url
    return h('span', { className: classNames, ...props }, children)
  },

  nunAdmonition(state: State, node: any): Element {
    const { admonitionType, title } = node.data ?? {}
    const children = state.all(node)
    return h('div', { className: ['admonition', admonitionType ?? 'note'] }, [
      h('div.admonition-title', title ?? ''),
      h('div.admonition-body', children),
    ])
  },
}
