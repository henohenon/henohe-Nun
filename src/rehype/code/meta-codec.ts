/**
 * code-block の meta encoding / decoding を双方向で扱う。
 *
 * rehypeNunCodePre が `language-foo:bar#1` のような fence info から
 * 構造化情報を抽出し、 ここで encode して `code.data.meta` に書く。 Shiki は
 * meta を `meta.__raw` 経由で transformer に渡し、 nunShikiTransformer が
 * decode して `<pre>` の `data-nun-*` 属性に転写する。
 *
 * encode と decode が形式の唯一の source of truth として同居する。
 */

const PREFIX = 'nun'
const SEP = ';'

export type CodeMeta = {
  lang: string
  name?: string
  start?: number
  diff?: boolean
}

export function encodeNunMeta(meta: CodeMeta): string {
  const parts: string[] = [PREFIX, meta.lang]
  if (meta.name) parts.push(`name=${meta.name}`)
  if (meta.start != null) parts.push(`start=${meta.start}`)
  if (meta.diff) parts.push('diff')
  return parts.join(SEP)
}

/** raw が nun-encoded でなければ null を返す。 呼び出し側で skip 判定。 */
export function decodeNunMeta(raw: string): CodeMeta | null {
  if (!raw.startsWith(`${PREFIX}${SEP}`)) return null
  const parts = raw.split(SEP)
  const lang = parts[1]
  if (!lang) return null

  const result: CodeMeta = { lang }
  for (const part of parts.slice(2)) {
    if (part.startsWith('name=')) {
      result.name = part.slice('name='.length)
    } else if (part.startsWith('start=')) {
      const n = parseInt(part.slice('start='.length), 10)
      if (!Number.isNaN(n)) result.start = n
    } else if (part === 'diff') {
      result.diff = true
    }
  }
  return result
}
