# フォント設計メモ (2026-06-19)

## 結論

### var inline の規則

**`!<varname>~<value>` → `--<varname>: <value>`、常に。例外なし。**

`src/rehype/templates.ts` の `VAR_INLINE_PREFIXES` ホワイトリストと prefix stripping を廃止。nwyt キーが CSS 変数名そのままになる。

### CSS 変数の改名

1語統一の命名方針。将来2語に拡張する可能性は認識しつつ、現状はこれで行く。

| 旧 | 新 | 理由 |
|----|-----|------|
| `--font-body` | `--text` | 1語・自明 |
| `--font-mono` | `--code` | 1語・自明 |

`--brand` `--base` `--main` `--sub` `--strong` `--radius` はそのまま。

### フォントの指定方法

新構文なし。既存の仕組みで対応できる。

**section/article 単位**（var inline）：
```markdown
!text~"Noto Sans JP", sans-serif
!code~"JetBrains Mono", monospace
```

**デッキ全体**：グローバルスコープ（最初の h1 より前）に書く。nwyt prop はグローバル指定で全 section・全 article に継承される（`technical.md` 参照）。`~~~meta` は不要。

### @font-face はユーザー任せ

`nunPlugin()` にフォント登録機能は追加しない。ユーザーが自分の CSS に書く：

```css
@font-face {
  font-family: "IBM Plex Sans JP";
  src: url("./fonts/IBMPlexSansJP-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

`font-display: swap` + `navigation.ts` の Font load 完了後 re-fit 対策で問題なし。

## 実装ログ

### `201f0e4` refactor(var-inline): prefix stripping 廃止・フォント変数を --text/--code に改名

- `src/rehype/templates.ts` — `VAR_INLINE_PREFIXES` と prefix stripping を廃止。`!<key>~<value>` → `--<key>` に統一
- `src/styles/theme.css` / `base.css` / `footer.css` / `code-block.css` — `--font-body` → `--text`、`--font-mono` → `--code`
- `benben/initiation.md` — `!color-brand~` → `!brand~`、`!size-radius~` → `!radius~` に更新
- `docs/spec/syntax.md` / `design.md` / `design-rework.md` — var inline の仕様記述を更新

**追加発覚バグ**: 最初の実装でハイフンなしキー（`!brand~` 等）が skip される条件を入れてしまった。

### `17383a1` feat(var-inline): ハイフン制約を撤廃、initiation に compare デモ追加

- `extractVarStyle` のハイフン制約を撤廃（`!brand~` `!radius~` 等が正しく動くように）
- `benben/initiation.md`: var inline セクションを以下の4ページに分割
  - `# Custom — 値 ref`（値 reference の説明のみ）
  - `# var inline`（compare: 色・角丸デモ）
  - `# var inline — フォント`（compare: --text / --code デモ）
  - `# var inline — CSS 変数`（リファレンス表）

### `f6c2e7b` docs(initiation): Index を更新

- Class（33/34）・Custom var inline（35–38）・Link card（39）を追加
- ページ番号を修正

## 検討過程メモ

- 当初 `~~~meta` でデッキ全体のフォントを指定する案 → グローバルスコープの nwyt prop 継承で代替できるため不要と判断
- `VAR_INLINE_PREFIXES` に `font` を追加する案 → prefix stripping で `--body` になってしまい CSS 変数名と不一致
- CSS 変数を `--color-brand` 等にフルキー化する案 → `--brand` の短さを失いたくないため却下
- `--body` / `--mono` に改名する案 → `--body` が曖昧すぎる
- **採用**: `--text` / `--code` + prefix stripping 廃止
