import type { NwytProp, Scope } from '../types.ts'

/**
 * scope 固有の nwyt prop を優先し、 無ければ global nwyt から fallback して取得。
 *
 * scope.nwyts (`!key~val` を heading 範囲内に書いたもの) が局所的な上書き、
 * globalNwyts (最初の section heading より前の `!key~val`) が deck 全体の
 * デフォルト。 「local 優先 + global fallback」 の意図を関数名で明示。
 */
export function findNwytInScope(
  scope: Scope,
  globalNwyts: NwytProp[],
  key: string,
): NwytProp | undefined {
  return findNwyt(scope.nwyts, key) ?? findNwyt(globalNwyts, key)
}

/** 単一 nwyt 配列から key で検索 */
export function findNwyt(nwyts: NwytProp[], key: string): NwytProp | undefined {
  return nwyts.find(n => n.key === key)
}

/**
 * `!bg~`, `!fbg~`, `!icon~` 等の image 系 nwyt の rawValue から src / alt を抽出。
 *
 * rawValue 形式:
 * - `[alt](url)` (推奨): nwyt syntax の `!` は外側 prop syntax で消費済みなので
 *   value 側は link 風の `[alt](url)` で書く慣例 (Markdown 画像 `![alt](url)` の
 *   `!` を二重にしない)
 * - `![alt](url)` (互換): `!` 付きも念のため受け付ける
 * - 素のパス (fallback): 上記マッチがなければ trim した文字列を src として扱う、
 *   alt は空文字
 *
 * 空文字や trim 後が空ならば null。 呼び出し側で skip 判定。
 */
export function parseImageNwytValue(raw: string): { src: string; alt: string } | null {
  const match = raw.match(/!?\[([^\]]*)\]\(([^)]+)\)/)
  if (match) return { src: match[2], alt: match[1] }
  const trimmed = raw.trim()
  if (!trimmed) return null
  return { src: trimmed, alt: '' }
}
