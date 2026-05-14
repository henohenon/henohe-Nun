import type { NwytProp, Scope } from '../types.ts'

/**
 * scope 固有の nwyt prop に global nwyt を継承マージして取得。
 *
 * - **rawValue** (URL / text): scope local 優先、 local 空なら global の値を継承
 * - **classes**: 常に `[...global.classes, ...local.classes]` で連結 (local が後ろ
 *   → hoist token (`tx-`/`ty-`/`op-`) の後勝ちで scope による override 可能、
 *   非 hoist class は両方残るので CSS 側で順序競合が無い限り併存する)
 *
 * 例: global `!fbg.at-br.lg~[](url)` + scope `!fbg.op-50~` →
 *     merged `{ rawValue: '[](url)', classes: ['at-br', 'lg', 'op-50'] }`
 *
 * scope / global どちらも欠けていれば undefined、 片方だけならそれを返す。
 */
export function findNwytInScope(
  scope: Scope,
  globalNwyts: NwytProp[],
  key: string,
): NwytProp | undefined {
  const local = findNwyt(scope.nwyts, key)
  const global = findNwyt(globalNwyts, key)
  if (!local) return global
  if (!global) return local
  return {
    ...local,
    rawValue: local.rawValue || global.rawValue,
    classes: [...global.classes, ...local.classes],
  }
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
