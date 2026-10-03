# Nun の Marp 移行 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 独自の unified パイプラインを捨て、純粋な Marp (marp-cli + 自前テーマ + `--html`) でデッキをビルド・公開できる状態にする。

**Architecture:** `benben/*.md` (Marp 記法) を `marp -I benben -o dist` で HTML 化し、`benben/images` と `public/` を `dist/` にコピーして Cloudflare Pages に上げる。見た目は `themes/nun.css` 1 枚、一覧ページは手書きの `public/index.html`。

**Tech Stack:** bun, @marp-team/marp-cli, tsx (scripts 用), wrangler

**Spec:** `docs/superpowers/specs/2026-10-03-marp-migration-design.md`

## Global Constraints

- 独自 engine / markdown-it プラグイン / 記法の糖衣は書かない
- md は Marp 標準記法のみ (Nun 記法は全廃)
- 画像参照は相対パス (`images/...`)。絶対パス `/images/...` は使わない
- スライドは固定 1280×720。cqmin / clamp / zoom-fit は持ち込まない
- コミットメッセージは日本語、末尾に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 各タスク終了時に `bun run build` が通ること (Task 2 以降)
- `bun run dev` を起動したら作業終了時に必ず停止する
- 本番デプロイ・タグの push はユーザー確認後のみ

## ファイル構成 (完了時)

| パス | 役割 |
|---|---|
| `benben/<deck>.md` | デッキ (Marp 記法) |
| `benben/images/` | デッキが参照する画像・SVG (旧 `public/images/` から移動) |
| `public/index.html` | 一覧ページ (手書き) |
| `public/_redirects` | 旧 URL `/<deck>/` からの転送 |
| `public/favicon/`, `public/henoheno.svg` | サイト共通ファイル (既存) |
| `themes/nun.css` | Marp テーマ |
| `marp.config.mjs` | marp-cli 共通設定 |
| `scripts/copy-static.ts` | ビルド後の静的ファイルコピー |
| `scripts/deploy.ts` | Cloudflare Pages デプロイ (簡素化) |
| `scripts/deck/*.ts` | ロゴ SVG 生成 (出力先・参照パスを変更) |
| `docs/archive/` | 旧 spec 類 |
| `docs/drafts/` | cool-game の非公開スライド |

---

### Task 1: 旧実装の保存と docs のアーカイブ

**Files:**
- Move: `docs/spec/` → `docs/archive/spec/`、`docs/dev-plan.md` `docs/design.md` `docs/design-rework.md` `docs/refactor-2026-05-07.md` → `docs/archive/`

- [ ] **Step 1: 旧実装にタグを打つ (ローカルのみ)**

```bash
git tag nun-v1 HEAD
git tag -l nun-v1
```
Expected: `nun-v1`

- [ ] **Step 2: 旧 docs を移動**

```bash
mkdir -p docs/archive
git mv docs/spec docs/archive/spec
git mv docs/dev-plan.md docs/design.md docs/design-rework.md docs/refactor-2026-05-07.md docs/archive/
ls docs docs/archive
```
Expected: `docs/` に `archive/ comparison.md journal-*.md research/ superpowers/` が残る

- [ ] **Step 3: コミット**

```bash
git commit -m "docs: 旧実装の spec 類を docs/archive へ移動

Marp 移行に伴い、旧 unified パイプラインの仕様を退避。旧実装はタグ nun-v1。"
```

---

### Task 2: Marp の骨格 (依存差し替え・設定・最小テーマ・Quaver 移行)

**Files:**
- Delete: `src/`、`vite.config.ts`、`uno.config.ts`、`benben/initiation.md`、`benben/fonts.md`、`benben/mobile-test.md`、`scripts/capture.ts`、`scripts/pdf.ts`、`scripts/render-mermaid.ts`、`scripts/svg-to-png.ts`、`scripts/test-playwright.ts`
- Move: `public/images/` → `benben/images/`
- Create: `marp.config.mjs`、`themes/nun.css`、`scripts/copy-static.ts`
- Modify: `package.json`、`tsconfig.json`、`.gitignore`、`benben/Quaver.md`

**Interfaces:**
- Produces: `bun run dev` / `bun run build`、テーマ名 `nun`、`dist/<deck>.html` の出力形

- [ ] **Step 1: 不要ファイルを削除し、画像を移動**

```bash
git rm -r -q src vite.config.ts uno.config.ts benben/initiation.md benben/fonts.md benben/mobile-test.md scripts/capture.ts scripts/pdf.ts scripts/render-mermaid.ts scripts/svg-to-png.ts scripts/test-playwright.ts
git mv public/images benben/images
```

- [ ] **Step 2: `scripts/_lib.ts` の利用者を確認**

```bash
grep -rln "_lib" scripts
```
Expected: `scripts/deploy.ts` のみ。他に無ければ `_lib.ts` は残す (deploy が使う)。

- [ ] **Step 3: 依存を差し替え**

```bash
bun remove @shikijs/rehype hast-util-from-html hast-util-to-string hastscript mdast-util-from-markdown mermaid micromark micromark-util-types open-graph-scraper rehype-mathjax rehype-stringify remark-breaks remark-gfm remark-math remark-parse remark-rehype unified unist-util-visit vfile vite pdf-lib playwright sharp unocss
bun add -d @marp-team/marp-cli
```

- [ ] **Step 4: `package.json` の scripts を差し替え**

```json
"scripts": {
  "dev": "marp -s benben",
  "build": "marp -I benben -o dist && tsx scripts/copy-static.ts",
  "pdf": "marp -I benben -o dist --pdf",
  "deploy": "tsx scripts/deploy.ts"
}
```

- [ ] **Step 5: `marp.config.mjs` を作成**

```js
// marp-cli 共通設定。dev (marp -s) / build / pdf すべてがこのファイルを読む。
export default {
  html: true,
  themeSet: './themes',
  allowLocalFiles: true,
}
```

- [ ] **Step 6: `scripts/copy-static.ts` を作成**

```ts
import { cpSync } from 'node:fs'

// marp -I は md → html の変換のみで画像をコピーしないため、ビルド後に静的ファイルを dist/ へ揃える
cpSync('benben/images', 'dist/images', { recursive: true })
cpSync('public', 'dist', { recursive: true })
```

- [ ] **Step 7: 最小テーマ `themes/nun.css` を作成** (Task 5 で旧デザインを移植する。ここでは表示できる最低限)

```css
/* @theme nun */

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=BIZ+UDPGothic:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap");

section {
  --base: #ffffff;
  --main: #1a1a1a;
  --brand: #5932ff;
  width: 1280px;
  height: 720px;
  padding: 58px 58px 72px;
  background: var(--base);
  color: var(--main);
  font-family: Inter, "BIZ UDPGothic", sans-serif;
  font-size: 36px;
}

h1 { color: var(--brand); font-size: 66px; margin: 0 0 0.3em; }
```

- [ ] **Step 8: `tsconfig.json` と `.gitignore` を整理**

`tsconfig.json` の `include` を `["scripts"]` にし、`vite/client` など削除した依存の型参照があれば外す。`.gitignore` から `.astro` `public/thumbs/` `public/fonts/` `src/assets/**/private/*` を削除する (`benben/private/*` は残す)。

```bash
cat tsconfig.json .gitignore
```

- [ ] **Step 9: Quaver を Marp 記法に書き換え**

`benben/Quaver.md` に spec の書き換え表を適用する。具体的には:
- `~~~meta` ブロック → front-matter (`theme: nun`、`description`、`header: 2026/05/11`、`footer: Quaver`)。`title` と `date` は削除
- `!fl~Quaver` / `!fr~2026/05/11` → 上記 front-matter に統合
- `!fbg...~[](...)` 行と `!bg.op-100~=fbg` 行 → 削除
- `🌊title` → `<!-- _class: title -->`
- `!sub~QRコードでなんか音を出すやつ` → `<p class="sub">QRコードでなんか音を出すやつ</p>`
- 各 `# ` の前 (最初を除く) に `---` を入れてスライドを区切る
- `!card[dotvoice](https://aidn.jp/dotvoice/)` → `[dotvoice](https://aidn.jp/dotvoice/)`
- `/images/` → `images/`

- [ ] **Step 10: Nun 記法が残っていないことを確認**

```bash
grep -nE '^🌊|^![a-z.]*~|^~~~meta|!card\[|!fn|^:::|```embed_' benben/Quaver.md
```
Expected: 出力なし

- [ ] **Step 11: build を通す**

```bash
bun run build
ls dist dist/images | head
```
Expected: `dist/Quaver.html`、`dist/cool-game-development-using-web-technologies.html` (この時点では崩れていてよい)、`dist/images/`、`dist/favicon/`

- [ ] **Step 12: dev で Quaver を目視確認**

`.claude/launch.json` に dev 構成 (`bun run dev`、PORT は marp の既定 8080) を追加して preview_start し、`/` にディレクトリ一覧、`/Quaver.md` にスライドが表示され、画像が出ることを確認。確認後 preview_stop。

- [ ] **Step 13: コミット**

```bash
git add -A
git commit -m "feat: unified パイプラインを撤去し Marp 構成に置き換え

marp-cli + themes/nun.css + marp.config.mjs で dev / build / pdf を構成。
画像は benben/images へ移し相対パスで参照。Quaver を Marp 記法へ移行。
initiation / fonts / mobile-test は削除 (タグ nun-v1 に残る)。"
```

---

### Task 3: `<object>` による外部 SVG の検証

**Files:**
- Create (一時): `benben/_object-test.md` (検証後に削除)

**Interfaces:**
- Produces: SVG の置き方の確定 (`<object>` 方式 or 直書き方式)。Task 4 がこれに従う

- [ ] **Step 1: cool-game の 1 つ目の `embed_svg` (Unity ロゴ、リンク入り) をファイル化してテストデッキを作る**

`benben/cool-game-development-using-web-technologies.md` 20 行目からの `embed_svg` の中身を `benben/images/cool-game/_test.svg` に保存し、`href="/images/engines/` を `href="../engines/` に置換。テストデッキ:

```markdown
---
theme: nun
---

# object test

<object data="images/cool-game/_test.svg" type="image/svg+xml" style="width:100%;height:500px"></object>
```

- [ ] **Step 2: dev で確認**

`/_object-test.md` を開き、確認する:
1. ロゴ画像が描画される (SVG 内の `../engines/` 参照が解決する)
2. ロゴをクリックすると `https://unity.com` が新しいタブで開く
3. `o` キーの一覧表示と、発表者ビュー (`p`) でも描画される

- [ ] **Step 3: build 後の HTML と PDF でも確認**

```bash
bun run build
npx marp benben/_object-test.md -o dist/_object-test.pdf
```
`dist/_object-test.html` をブラウザで開いて 1・2 を確認。PDF はロゴが描画されていることを確認 (リンクは問わない)。

- [ ] **Step 4: 方式を確定し、テストファイルを削除**

全部通れば `<object>` 方式。どれかが駄目なら直書き方式 (`<svg>` を md に直接書き、`href` は `images/engines/...`) とし、spec の「SVG の置き方」を確定した方式に書き換える。

```bash
rm benben/_object-test.md benben/images/cool-game/_test.svg dist/_object-test.*
```

- [ ] **Step 5: (方式が変わった場合のみ) spec を更新してコミット**

```bash
git add docs/superpowers/specs/2026-10-03-marp-migration-design.md
git commit -m "docs(spec): SVG の置き方を検証結果に合わせて確定"
```

---

### Task 4: cool-game の移行

**Files:**
- Modify: `benben/cool-game-development-using-web-technologies.md`
- Create: `benben/images/cool-game/*.svg` (Task 3 で `<object>` 方式に決まった場合)、`docs/drafts/cool-game-unused.md`
- Modify: `scripts/deck/gen-logo-map.ts`、`scripts/deck/gen-lib-row.ts`、`scripts/deck/README.md`

**Interfaces:**
- Consumes: Task 3 で確定した SVG 方式、Task 2 のテーマ名 `nun`
- Produces: class `title` / `solo` / `message`、`<p class="sub">` / `<p class="lead">`、`header` / `footer` の使い方 (Task 5 のテーマがこれを前提にする)

- [ ] **Step 1: 非公開スライドを退避**

533 行目の `<!-- ===== 以下、The End 以降の仮スライド (非公開) =====` から末尾 627 行目の `===== 仮スライドここまで ===== -->` までを `docs/drafts/cool-game-unused.md` に移し、デッキから削除する。退避先の先頭に「旧 Nun 記法のまま退避。復活させる時は Marp 記法に書き換える」と 1 行書く。

- [ ] **Step 2: `embed_svg` をファイル化 (`<object>` 方式の場合)**

スクラッチパッドで使い捨てのスクリプトを書いて、`embed_svg` フェンスを出現順に `benben/images/cool-game/NN.svg` (01〜) に書き出し、フェンスを `<object data="images/cool-game/NN.svg" type="image/svg+xml"></object>` に置き換える。SVG 内の `href="/images/` は `href="../` に置換する。そのうえで、ロゴマップの段階表示 (同じ配置で段階的に出るもの) は `gen-logo-map.ts` の出力名に合わせて `logo-map-1.svg`〜`logo-map-N.svg` と `logo-map.svg` に、ライブラリ横並びは `lib-row.svg` にリネームし、md の参照も合わせる。それ以外は内容を表す名前にリネームする。

(直書き方式の場合は、フェンスを外して `<svg>` をそのまま残し、`href="/images/` を `href="images/` に置換する)

- [ ] **Step 3: 本文を書き換え表に従って移行**

- `~~~meta` → front-matter (`theme: nun`、`header: 2026/09/20`)。`title` / `date` は削除
- `!fr~2026/09/20` → front-matter の `header` に統合
- スライド区切り: 各 `#` の前 (最初を除く) に `---`。空の `#` 行は削除
- `🌊default` → 削除、`🌊title` / `🌊solo` / `🌊message` → `<!-- _class: ... -->`
- `!fl~X` → `<!-- _footer: X -->`。同じ値が連続するスライドの先頭なら `<!-- footer: X -->` にして後続の重複を消し、値が変わる/消える所で `<!-- footer: ... -->` を書き直す
- `!lead~X` → スライド末尾に `<p class="lead">X</p>`
- `==X==` → `<mark>X</mark>`
- `embed_html` → フェンスを外して HTML を直接書く。`src="/images/` → `src="images/`
- 残りの `/images/` → `images/`

- [ ] **Step 4: Nun 記法・絶対パスが残っていないことを確認**

```bash
grep -nE '^🌊|^![a-z.]*~|^~~~meta|!card\[|!fn|^:::|```embed_|==[^=]+==|"/images/|\(/images/' benben/*.md
grep -n '/images/' benben/images/cool-game/*.svg
```
Expected: どちらも出力なし

- [ ] **Step 5: ジェネレーターの出力先と参照パスを変更**

`scripts/deck/gen-logo-map.ts` と `gen-lib-row.ts` で:
- `const DIR = 'public/images/engines'` → `'benben/images/engines'`
- `href="/images/engines/${it.file}"` → `href="../engines/${it.file}"` (全箇所)

`scripts/deck/README.md` の使い方を「md に貼り付け」から「`benben/images/cool-game/` に書き出し、md からは `<object>` で参照」に書き換え、実行例を `tsx scripts/deck/gen-logo-map.ts benben/images/cool-game/logo-map.svg [seed]` / `tsx scripts/deck/gen-lib-row.ts benben/images/cool-game/lib-row.svg` にする。

- [ ] **Step 6: build と目視確認**

```bash
bun run build
```
dev で `/cool-game-development-using-web-technologies.md` を開き、全スライドを送って SVG・画像・リンクが出ていることを確認 (見た目の作り込みは Task 5)。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat(deck): cool-game を Marp 記法へ移行

embed_svg を benben/images/cool-game/ に外部化、ロゴ生成スクリプトの出力先を変更。
非公開の仮スライドは docs/drafts/ へ退避。"
```

---

### Task 5: テーマの移植

**Files:**
- Modify: `themes/nun.css`
- Create: `benben/images/henoheno.svg`
- Modify: `benben/cool-game-development-using-web-technologies.md`、`benben/Quaver.md` (title スライドに henoheno を追加)

**Interfaces:**
- Consumes: Task 4 の class / 要素の使い方
- 旧デザインの出典: タグ `nun-v1` の `src/styles/{theme,base,body,footer,code-block}.css`、`src/styles/templates/{title,solo,message}.css`。旧値は cqmin 基準なので 1280×720 (cqmin = 7.2px) で px に換算済みの値を使う

- [ ] **Step 1: henoheno を brand 色で焼き込んだ SVG を用意**

```bash
grep -c currentColor public/henoheno.svg
sed 's/currentColor/#5932ff/g' public/henoheno.svg > benben/images/henoheno.svg
```
title スライドの末尾に `![henoheno](images/henoheno.svg)` を追加 (cool-game / Quaver とも)。

- [ ] **Step 2: `themes/nun.css` を全面的に書く**

```css
/* @theme nun */

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=BIZ+UDPGothic:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap");

/* ---- Tokens (旧 theme.css。cqmin 値は 1280×720 で px 換算) ---- */
section {
  --base: #ffffff;
  --main: #1a1a1a;
  --sub: #888888;
  --strong: #000000;
  --brand: #5932ff;
  --muted: color-mix(in srgb, var(--base) 96%, var(--main));
  --fg-mid: color-mix(in srgb, var(--main) 50%, var(--sub));
  --border: color-mix(in srgb, var(--base) 70%, var(--sub));
  --code-accent: #d6336c;
  --text: Inter, "BIZ UDPGothic", -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif;
  --code: "JetBrains Mono", Consolas, Monaco, Menlo, monospace;
  --radius: 0.4em;
  --footer-font-size: 29px;
  --footer-line: 14px;

  width: 1280px;
  height: 720px;
  box-sizing: border-box;
  /* 下端 = (pad 58 - footer 文字 29) + footer 高さ (29 + 14) */
  padding: 58px 58px 72px;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--base);
  color: var(--main);
  font-family: var(--text);
  font-size: 36px;
}

/* ---- Footer: 下端の黒帯 + 左 footer / 右 header (旧 !fl / !fr) ---- */
section::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--footer-line);
  background: var(--strong);
}
section > header,
section > footer {
  position: absolute;
  top: auto;
  bottom: var(--footer-line);
  margin: 0;
  padding: 0;
  font-size: var(--footer-font-size);
  line-height: 1;
  color: var(--strong);
}
section > footer { left: 0.6em; }
section > header { right: 0.6em; left: auto; }

/* ---- Headings ---- */
h1, h2, h3, h4, h5, h6 { color: var(--brand); text-wrap: balance; margin: 0; }
h1 { font-size: 66px; line-height: 1.1; margin-block-end: 0.3em; }
h2 { font-size: 47px; line-height: 1.1; margin-block-end: 0.2em; }
h3 { font-size: 35px; line-height: 1.15; margin-block-end: 0.2em; }
h4, h5, h6 { font-size: 29px; margin-block-end: 0.15em; }

/* ---- Body ---- */
p { line-height: 1.65; margin: 0 0 0.4em; }
ul, ol { padding-inline-start: 1.4em; margin: 0 0 0.35em; line-height: 1.6; }
li { margin-block-end: 0.1em; }
a { color: var(--brand); text-decoration: underline; }
mark { background: color-mix(in srgb, var(--brand) 30%, transparent); color: inherit; border-radius: 0.15em; padding: 0 0.1em; }
blockquote { margin: 0; border-left: 4px solid var(--border); padding-inline-start: 0.75em; color: var(--fg-mid); font-style: italic; }
hr { border: none; border-top: 1px solid var(--border); margin-block: 0.5em; }
img { max-width: 100%; }
object { display: block; width: 100%; flex: 1 1 0; min-height: 0; }

/* ---- Table ---- */
table {
  --table-border-color: color-mix(in srgb, var(--main) 30%, var(--base));
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin-block-end: 0.4em;
  border: 1px solid var(--table-border-color);
  border-radius: var(--radius);
  overflow: hidden;
}
th, td {
  border: 0;
  border-right: 1px solid var(--table-border-color);
  border-bottom: 1px solid var(--table-border-color);
  padding: 0.3em 0.6em;
  text-align: left;
}
th[align="center"], td[align="center"] { text-align: center; }
th[align="right"], td[align="right"] { text-align: right; }
th:last-child, td:last-child { border-right: 0; }
tr:last-child > th, tr:last-child > td { border-bottom: 0; }
th { background: var(--muted); font-weight: 600; }

/* ---- Code ---- */
:not(pre) > code {
  font-family: var(--code);
  background: var(--muted);
  color: var(--code-accent);
  padding: 0.1em 0.35em;
  border-radius: 0.2em;
  font-size: 0.88em;
}
pre {
  margin: 0 0 0.4em;
  padding: 0.75em 1em;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--muted);
  font-family: var(--code);
  font-size: 0.75em;
  line-height: 1.5;
  overflow: hidden;
}
pre code { font-family: inherit; }
/* highlight.js (Marp 標準) の配色。GitHub light 相当 */
.hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-type { color: #d73a49; }
.hljs-string, .hljs-regexp, .hljs-addition { color: #032f62; }
.hljs-number, .hljs-literal, .hljs-variable, .hljs-template-variable { color: #005cc5; }
.hljs-title, .hljs-section, .hljs-function .hljs-title { color: #6f42c1; }
.hljs-attr, .hljs-attribute, .hljs-name, .hljs-tag { color: #22863a; }
.hljs-built_in, .hljs-symbol { color: #e36209; }
.hljs-deletion { color: #b31d28; }

/* ---- Template: title ---- */
section.title { justify-content: center; }
section.title > h1 { color: var(--strong); line-height: 1.05; max-width: 65%; position: relative; z-index: 1; }
section.title > .sub { font-size: 29px; color: var(--fg-mid); margin-block-start: 0.5em; max-width: 65%; line-height: 1.4; position: relative; z-index: 1; }
section.title img[alt="henoheno"] {
  position: absolute;
  right: -10px;
  bottom: 3%;
  width: 80%;
  height: auto;
  transform: translate(0%, 30%);
  pointer-events: none;
  z-index: 0;
}

/* ---- Template: solo ---- */
section.solo { justify-content: center; align-items: center; }
section.solo > h1 { margin: 0; text-align: center; max-width: 80%; }

/* ---- Template: message ---- */
section.message > h1 + * { margin-block-start: auto; }
section.message > :not(h1, .lead, header, footer) { align-self: center; text-align: center; max-width: 80%; }
section.message > .lead {
  margin-block-start: auto;
  text-align: center;
  font-size: 47px;
  color: var(--strong);
  letter-spacing: 0.05em;
  padding-block-end: 0.4em;
}
```

- [ ] **Step 3: 旧版と見比べる**

旧版の見た目は `git worktree add ../nun-v1 nun-v1` → そこで `bun install && bun run dev` で出す (確認後に停止し、`git worktree remove ../nun-v1`)。新版 (`bun run dev`) と cool-game の title / solo / message / 表 / SVG / コードのスライドを並べて screenshot を取り、明らかな差 (余白、文字サイズ、フッターの位置、henoheno の位置) を CSS で詰める。ピクセル一致は求めない。

- [ ] **Step 4: はみ出し確認**

cool-game / Quaver の全スライドを送り、下端のフッター帯に本文が被るスライドが無いことを確認する。被る場合はテーマを変えず、そのスライドの md 側 (画像なら `![h:400](...)` 等) で直す。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat(theme): 旧デザインを themes/nun.css に移植

文字組み・色・フッター帯・表・コード・title/solo/message を 1280×720 固定で再現。"
```

---

### Task 6: サイト化 (一覧・転送・デプロイ・PDF)

**Files:**
- Create: `public/index.html`、`public/_redirects`
- Modify: `scripts/deploy.ts`、`.env.deploy.example`

- [ ] **Step 1: `public/index.html` を作成**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" sizes="48x48" href="favicon/favicon.ico">
  <title>Nun - Decks</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    ul { list-style: none; padding: 0; }
    li { display: flex; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    li > a { flex: 1; font-size: 1.05rem; text-decoration: none; color: inherit; }
    li > a:hover { text-decoration: underline; }
    time { color: #888; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Decks</h1>
  <ul>
    <li><a href="cool-game-development-using-web-technologies">Web技術でイイ感じのゲーム開発</a><time>2026-09-20</time></li>
    <li><a href="Quaver">Quaver</a><time>2026-05-11</time></li>
  </ul>
</body>
</html>
```

(リンクは Cloudflare Pages の拡張子なし URL。ローカルの `dist/` を file:// で開くと辿れないが、本番前提とする)

- [ ] **Step 2: `public/_redirects` を作成**

```
/cool-game-development-using-web-technologies/ /cool-game-development-using-web-technologies 301
/Quaver/ /Quaver 301
```

- [ ] **Step 3: `scripts/deploy.ts` を簡素化**

`NUN_BASE` / `DEPLOY_DECK` の環境変数操作を削除する。`--deck` 指定時は 1 デッキだけビルドする:

```ts
if (deck) {
  await runCommand('bunx', ['marp', `benben/${deck}.md`, '-o', `dist/${deck}.html`])
  await runCommand('bunx', ['tsx', 'scripts/copy-static.ts'])
} else {
  await runCommand('bun', ['run', 'build'])
}
```

`.env.deploy.example` から `NUN_SITE_URL` の行を削除する。実行前に `rm -rf dist` 相当で古い出力が混ざらないよう、ビルド前に `rmSync('dist', { recursive: true, force: true })` を入れる。

- [ ] **Step 4: build と PDF を確認**

```bash
bun run build && ls dist
bun run pdf && ls dist/*.pdf
```
Expected: `index.html`、`_redirects`、各デッキの `.html`、各デッキの `.pdf`。PDF を開いて SVG とフッターが描画されていることを確認。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat: 一覧ページ・旧 URL の転送・デプロイスクリプトを Marp 構成に合わせる"
```

- [ ] **Step 6: (ユーザー確認後) プレビュー → 本番デプロイ**

ユーザーに確認してから `bun run deploy --deck Quaver` でプレビューを出し、URL で表示を確認。続けて確認を取って `bun run deploy` で本番に上げ、旧 URL `/cool-game-development-using-web-technologies/` が新 URL に転送されることを確認する。

---

### Task 7: ドキュメント更新

**Files:**
- Modify: `CLAUDE.md`、`README.md`

- [ ] **Step 1: `CLAUDE.md` を新構成に書き直す**

残す: Language (日本語)、Development Philosophy のうち構成に依存しない部分 (Think Before You Code / Minimal, Intentional Changes / Ask When Uncertain)、`bun run dev` 停止のルール、Egyptian 命名の由来。
書き換える: Project Overview (純粋な Marp でデッキを作り公開するリポジトリ)、Specs (`docs/superpowers/specs/2026-10-03-marp-migration-design.md`、旧 spec は `docs/archive/`)、Architecture (benben → marp → dist → copy-static → CF Pages)、Commands (dev / build / pdf / deploy)、Tech Stack (bun / marp-cli / tsx / wrangler)、記法 (Marp 標準のみ、画像は相対パス、SVG は `<object>`)。
削除する: Scope / nwyt / micromark / Vite plugin / hastscript / UnoCSS / Article 命名の記述。

- [ ] **Step 2: `README.md` を同様に更新**

```bash
cat README.md
```
で現状を見て、旧パイプライン・記法の説明を Marp 構成とコマンドの説明に置き換える。

- [ ] **Step 3: 旧記法の記述が残っていないか確認**

```bash
grep -nE 'nwyt|micromark|Scope|🌊|unified|UnoCSS|Vite' CLAUDE.md README.md
```
Expected: 出力なし (由来の説明として残す場合を除く)

- [ ] **Step 4: コミット**

```bash
git add CLAUDE.md README.md
git commit -m "docs: CLAUDE.md と README を Marp 構成に合わせて更新"
```
