import type { ShikiTransformer } from 'shiki'
import { decodeNunMeta } from './code-meta-codec.ts'

/**
 * Shiki transformer that reads nun metadata from `meta.__raw` and transfers
 * it to `data-nun-*` attributes on the output `<pre>` element.
 *
 * encoding/decoding 仕様は `code-meta-codec.ts` を参照 (single source)。
 */
export const nunShikiTransformer: ShikiTransformer = {
  name: 'nun',
  pre(node) {
    const raw: string = (this.options.meta as Record<string, string>)?.__raw ?? ''
    const meta = decodeNunMeta(raw)
    if (!meta) return

    node.properties['data-nun-lang'] = meta.lang
    if (meta.name != null) node.properties['data-nun-name'] = meta.name
    if (meta.start != null) node.properties['data-nun-start'] = String(meta.start)
    if (meta.diff) node.properties['data-nun-diff'] = ''
  },
}
