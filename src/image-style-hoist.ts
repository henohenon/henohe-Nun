/**
 * Image utility 微調整 class を inline `style` 属性へ hoist する変換層、
 * および subtract token (`^foo`) で継承 class list から除去する変換層。
 *
 * - **微調整 hoist**: `.at-*` (9 セル positioning) と組み合わせる微調整専用
 *   token を、 CSS class ではなく直接 inline style として出力することで、
 *   任意 value (単位 / 0-100 range) を class 名前空間制約 (`[a-zA-Z0-9_%-]`)
 *   に縛られず使えるようにする
 * - **subtract**: `^foo` 形式の token を見たら、 同名 class を list から
 *   除去 (継承された default を打ち消す用)。 例: global `!fbg.mono~` の上で
 *   scope `!fbg.^mono~` を書くと `mono` が消える
 *
 * 対応 token:
 *
 * | token        | 例           | 出力                          |
 * |--------------|-------------|------------------------------|
 * | `^<name>`    | `^mono`     | `name` class を list から除去 |
 * | `tx-<n><u>`  | `tx-10px`   | `translate: 10px 0`          |
 * | `ty-<n><u>`  | `ty--50%`   | `translate: 0 -50%`          |
 * | `op-<n>`     | `op-30`     | `opacity: 0.3` (n = 0-100)   |
 *
 * - subtract: `^foo` 自体は出力 class に残さない、 `foo` も list から除去
 *   される。 対象 class が無くても (= 存在しない class を引いても) error なし
 * - tx/ty: 値部分は `<数値><単位>` 形式 (単位は `%` `px` `em` `cqmin` 等)、
 *   負号は token 先頭 `-` (`tx--10px`)、 片軸のみ指定可 (他軸 0 暗黙)、
 *   同軸重複は後勝ち
 * - op: 0-100 integer (Tailwind 互換)、 内部で /100 して `opacity` 値に
 * - 形式不正 (`tx-abc` `op-200` 等) は class として残す (UnoCSS / 任意 class
 *   へ委譲)
 *
 * `.at-*` は transform 不使用 (inset + margin: auto) なので CSS `translate:`
 * プロパティ枠は空いている。 spec docs/spec/syntax.md の image utility 節参照。
 */

const TRANSLATE_RE = /^t([xy])-(-?\d+(?:\.\d+)?[a-z%]+)$/
const OPACITY_RE = /^op-(\d{1,3})$/

export interface ExtractImageStylesResult {
  classes: string[]
  style?: string
}

export function extractImageStyles(classes: string[]): ExtractImageStylesResult {
  // Step 1: subtract pass — `^foo` token を集めて、 同名 class を list から除去。
  // `^foo` token 自体も list から落ちる (consumed)。
  const subtracts = new Set<string>()
  const afterSubtract: string[] = []
  for (const cls of classes) {
    if (cls.length > 1 && cls.charCodeAt(0) === 94 /* ^ */) {
      subtracts.add(cls.slice(1))
      continue
    }
    afterSubtract.push(cls)
  }
  const filtered = subtracts.size > 0
    ? afterSubtract.filter(c => !subtracts.has(c))
    : afterSubtract

  // Step 2: hoist pass — tx/ty/op token を inline style に変換、 残りは class。
  const remaining: string[] = []
  let tx: string | undefined
  let ty: string | undefined
  let opacity: string | undefined
  for (const cls of filtered) {
    const t = TRANSLATE_RE.exec(cls)
    if (t) {
      if (t[1] === 'x') tx = t[2]
      else ty = t[2]
      continue
    }
    const o = OPACITY_RE.exec(cls)
    if (o) {
      const n = Number(o[1])
      if (n >= 0 && n <= 100) {
        opacity = (n / 100).toString()
        continue
      }
    }
    remaining.push(cls)
  }
  const decls: string[] = []
  if (tx !== undefined || ty !== undefined) {
    decls.push(`translate: ${tx ?? '0'} ${ty ?? '0'}`)
  }
  if (opacity !== undefined) {
    decls.push(`opacity: ${opacity}`)
  }
  if (decls.length === 0) return { classes: remaining }
  return { classes: remaining, style: decls.join('; ') }
}
