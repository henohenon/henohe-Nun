import type { State, Handler } from 'mdast-util-to-hast'
import { h } from 'hastscript'
import type { Element } from 'hast'

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
