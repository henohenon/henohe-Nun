/**
 * admonition (`:::note` / `:::warning` 等) の共有定数と型。
 *
 * 現状 admonition には 2 系統の実装が並走している:
 * - `src/micromark/admonition.ts` (整備中、 nun-syntax.ts で disable)
 * - `src/remark/nun-admonition.ts` (実働)
 *
 * 両者で `DEFAULT_TITLES` (種別名 → デフォルトタイトル文字列の辞書) を二重に
 * 持っていたため、 ここに集約して両方から import する。
 */

/** spec syntax.md で定義されている admonition 種別 */
export const ADMONITION_TYPES = ['note', 'info', 'tip', 'warning', 'alert'] as const

export type AdmonitionType = (typeof ADMONITION_TYPES)[number]

/**
 * カスタムタイトル無指定時の表示タイトル。
 *
 * 表記は spec syntax.md の例に揃えた英大文字始まりの 1 単語。 ユーザが
 * `:::note カスタム` のように custom title を書いた場合は除外され、
 * 未指定時のみこの辞書が使われる。
 */
export const DEFAULT_TITLES: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  alert: 'Alert',
}
