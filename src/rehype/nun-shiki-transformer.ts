import type { ShikiTransformer } from 'shiki'

/**
 * Shiki transformer that reads nun metadata from meta.__raw and
 * transfers it to data-nun-* attributes on the output <pre> element.
 *
 * Meta format set by rehypeNunCodePre: "nun;<lang>[;name=<n>][;start=<n>][;diff]"
 */
export const nunShikiTransformer: ShikiTransformer = {
  name: 'nun',
  pre(node) {
    const raw: string = (this.options.meta as Record<string, string>)?.__raw ?? ''
    if (!raw.startsWith('nun;')) return

    const parts = raw.split(';')
    const lang = parts[1]
    if (lang) node.properties['data-nun-lang'] = lang

    for (const part of parts.slice(2)) {
      if (part.startsWith('name=')) {
        node.properties['data-nun-name'] = part.slice(5)
      } else if (part.startsWith('start=')) {
        node.properties['data-nun-start'] = part.slice(6)
      } else if (part === 'diff') {
        node.properties['data-nun-diff'] = ''
      }
    }
  },
}
