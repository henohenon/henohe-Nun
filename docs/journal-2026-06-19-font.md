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

---

## フォント選定セッション (後半)

`benben/fonts.md` を作って実際に目で見ながら選定。

### 決定フォント

| 変数 | 値 |
|------|-----|
| `--text` | `Inter, "BIZ UDPGothic", -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif` |
| `--code` | `"JetBrains Mono", "Consolas", "Monaco", "Menlo", monospace` |

### `--text` の選定根拠

CSS font stack はグリフ単位でフォールバックするため、`Inter, "BIZ UDPGothic"` と並べると Inter が Latin/数字を担当し、Inter にグリフがない日本語は BIZ UDPGothic が自動的に担当する。

- **Inter**: ラテン文字・数字に特化した画面向け設計。x-height が高く小サイズでの視認性が高い
- **BIZ UDPGothic**: UD (ユニバーサルデザイン) 設計で判別しやすさ最優先。Windows 10+ にシステムフォントとして同梱されているため Google Fonts 未接続時のフォールバックにもなる
- `-apple-system` 以降は macOS/iOS フォールバック

**没になった候補**:
- `Noto Sans JP` 単体: 次点。Latin/Japanese が同一ファミリーでメトリクスが揃うが、Latin が Inter に劣る
- `Plus Jakarta Sans + Zen Kaku Gothic New`: 個性あり、代替として有効
- `Poppins`: 日本語グリフなし、混植で OS fallback が露骨に見える
- `M PLUS Rounded 1c` / `Klee One`: カジュアルすぎてプレゼン向きでない
- `f.k 機械彫刻 TTF`: 見やすいが「見やすい ≠ 頭に入る」。フォント自体が目立ちすぎてコンテンツの邪魔をする。数字のメトリクスが cqmin ベースのスケールと相性が悪い

### `--code` の選定根拠

- **JetBrains Mono**: 読みやすいリガチャあり（`=>` `!=` 等）、x-height が高め、プレゼン投影向き。コーディングで日常使いしているので評価が安定している
- **Fira Code**: JetBrains Mono と同じくリガチャあり。甲乙つけがたいが JetBrains Mono をすでに使っているため JetBrains Mono に統一

### 技術的な修正

**CSS cascade バグ修正** (`src/styles/base.css`):

`section { font-family: var(--text) }` は section レベルで `var(--text)` を評価した**計算済み文字列**を継承する。そのため article で `!text~` で `--text` を上書きしても `font-family` には反映されなかった。`article { font-family: var(--text) }` を追加することで article 自身が `var(--text)` を再評価するようになった。

`!code~` が動いていたのは `code { font-family: var(--code) }` が base.css にすでにあり、code 要素が自分で `var(--code)` を参照していたため。

**compare テンプレート auto-fit** (`src/styles/templates/compare.css`):

`grid-template-columns: 1fr 1fr` → `repeat(auto-fit, minmax(0, 1fr))` に変更。h2 の数がそのまま列数になる（2列でも3列でも自動対応）。

**CSS `@import` の順序ルール**:

`@font-face` を `@import url()` より前に書くと CSS が無効になる。`@import` はファイルの先頭に置く必要がある（他のルールが何もない状態）。今回 2 回この罠を踏んだ。

### PDF とフォントの関係

| 状況 | フォントの挙動 |
|------|---------------|
| `bun run dev` / `bun run build` (HTML) | ブラウザがレンダリング時にネットワーク or ローカルサーバーからフォントを取得。Google Fonts はネット接続が必要 |
| PDF 生成 (Playwright/Chromium) | Chromium が自動でフォントをサブセット埋め込み。生成後の PDF は完全自己完結。ローカルフォント・Google Fonts ともに PDF 内に埋め込まれる |

### ローカルフォントのライセンス対応

`f.k 機械彫刻 TTF`（font.kim）・`BestTen-DOT` / `BestTen-CRT`（BOOTH）はフォントファイルの再配布にライセンス上の制約があるため `public/fonts/` を `.gitignore` に追加した。ローカルでの使用は問題なく、別マシンでは手動配置が必要。

### 実装ログ

- `src/styles/base.css` — `article { font-family: var(--text) }` 追加（cascade バグ修正）
- `src/styles/theme.css` — `@import` 順序修正、ローカル `@font-face` 追加、`--text`/`--code` 最終値を設定
- `src/styles/templates/compare.css` — auto-fit に変更
- `.gitignore` — `public/fonts/` 追加
- `benben/fonts.md` — フォント比較デッキ作成
