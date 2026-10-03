# Nun の Marp 移行 — 設計 (2026-10-03)

前提となる議論: `docs/journal-2026-09-29-marp.md`、試作: `docs/research/marp-spike/`。

## 方針

- **純粋な Marp で作る**。marp-cli + 自前テーマ CSS + `--html` のみ。独自 engine / markdown-it プラグイン / 記法の糖衣は書かない
- md は Marp 標準記法で書く。Nun 記法 (🌊 / nwyt / `~~~meta` / `:::` / `==mark==` / `embed_*` 等) は全廃
- 素の Marp で足りないと感じたら、その時に改めて拡張を検討する (今回の範囲外)
- Marp の外で作るのは **一覧ページ (手書き HTML) とビルド時のファイルコピー、デプロイ** だけ

## ディレクトリ構成 (移行後)

```
benben/
  <deck>.md                 デッキ (Marp 記法)
  images/                   デッキが参照する画像・SVG (旧 public/images)
public/
  index.html                一覧ページ (手書き、本番用)
  favicon.ico, henoheno.svg 等のサイト共通ファイル
themes/
  nun.css                   Marp テーマ (@theme nun)
marp.config.mjs             marp-cli 設定 (html: true, themeSet 等)
scripts/deploy.ts           Cloudflare Pages デプロイ
dist/                       ビルド出力 (git 管理外)
```

- 画像を `benben/` 配下に置くのは、dev サーバー (`marp -s benben`) が `benben/` を静的配信するため
- 画像は **相対パス** (`images/...`、SVG 内からは `../engines/...` 等) で参照する。絶対パス `/images/...` は PDF 変換 (file://) で解決できないため。相対パスなら dev / `dist/` / PDF のすべてで解決する
- 一覧ページを `public/` に分けるのは、dev では `/` に Marp のディレクトリ一覧を出したいため (`benben/index.html` があると `/` がそれに置き換わる)

## コマンド

| コマンド | 中身 |
|---|---|
| `bun run dev` | `marp -s benben` (サーバーモード。`/<deck>.md` を開くと都度変換、`?pdf` 等で各形式) |
| `bun run build` | `marp -I benben -o dist` → `scripts/copy-static.ts` で `benben/images` と `public/` を `dist/` へコピー (bun shell の `cp` は `public/.` の展開が GNU と異なるため TS で書く) |
| `bun run pdf` | `marp -I benben -o dist --pdf` |
| `bun run deploy` | build → `wrangler pages deploy dist`。`--deck <name>` 指定時の推測不能なプレビュー URL は維持 |

- marp-cli の共通オプションは `marp.config.mjs` に書き、コマンドを短く保つ
- 出力は `dist/<deck>.html` (フラット)。旧 Nun の `dist/<deck>/index.html` とは URL が変わる (後述のリスク)

## 記法の書き換え表

| 旧 Nun | Marp |
|---|---|
| `#` によるページ区切り (空の `#` を含む) | `---` で区切る。`headingDivider` は使わない。空の `#` は削除 |
| スライド内の `##` / `###` | そのまま (1 枚の中の見出しとして描画される) |
| `~~~meta` (title / description / date) | front-matter。`title` は省略可 (最初の見出しから自動で入る)。`description` は必要なら書く。`date` は捨てる |
| デッキ全体の `!fr~` | front-matter の `header:` (テーマで右下に配置) |
| `!fl~` | `<!-- _footer: ... -->`。章の頭で以降に引き継ぐ場合は `<!-- footer: ... -->` |
| `🌊default` | 何も書かない (テーマの既定) |
| `🌊title` / `🌊solo` / `🌊message` | `<!-- _class: title -->` 等 |
| `!sub~` / `!lead~` | HTML を直接書く (`<p class="sub">` / `<p class="lead">`) |
| `==mark==` | `<mark>` |
| `embed_html` | フェンスを外して HTML を直接書く |
| `embed_svg` | 外部ファイル化して `<object>` で参照 (下記) |
| `!card[タイトル](url)` | 普通のリンク `[タイトル](url)` |
| `!fbg~` / `!bg.*~=fbg` | 削除 |
| HTML コメントで隠した非公開スライド | Marp では発表者メモとして出力されるため、md から外して `docs/drafts/` に退避 |

### SVG の置き方

cool-game の `embed_svg` は内部に `<a href>` のリンクと `<image href="/images/engines/...">` の外部画像参照を持つ。`![](x.svg)` (= `<img>`) ではリンクも内部画像も効かないため:

1. **第一案**: `benben/images/<deck>/<name>.svg` に書き出し、`<object data="images/<deck>/<name>.svg" type="image/svg+xml"></object>` で参照する
2. **代替案**: 第一案が Marp のスライド (inline SVG の foreignObject 内) で正しく描画・クリックできなければ、`<svg>` を md に直接書く

フェーズ 1 の最初に第一案を検証して確定する。

## テーマ (`themes/nun.css`)

- 固定キャンバス 1280×720 (`@size` 既定)。cqmin / clamp による可変レイアウトは持ち込まない
- 旧 `src/styles/` の見た目 (文字組み、色の変数、フッター線、コードブロック、表) を px ベースで移植する
- class は **移行するデッキで使っているものだけ**: `title` / `solo` / `message`。`me` / `window` / `compare` / `table-zebra` は移植しない
- `header` (旧 `!fr`) は右下、`footer` (旧 `!fl`) は左下に配置する
- シンタックスハイライトは Marp 標準 (highlight.js) にテーマ側で色を当てる

## 移行するデッキ

| デッキ | 扱い |
|---|---|
| `cool-game-development-using-web-technologies.md` | 移行する (本番の LT) |
| `Quaver.md` | 移行する |
| `initiation.md` / `fonts.md` / `mobile-test.md` | 削除 (旧実装のタグに残る) |

書き換えは手作業 (AI 含む) の一回きり。移行スクリプトは作らない。

## 削除するもの

- `src/` 全体、`vite.config.ts`、`uno.config.ts` (`tsconfig.json` と `tsx` は `scripts/` の TS 用に残す)
- 依存: vite、unified / micromark / remark / rehype 系、hastscript、shiki、mermaid、mathjax、unocss、open-graph-scraper、playwright、sharp、pdf-lib
- `scripts/` のうち `capture.ts` / `pdf.ts` / `render-mermaid.ts` / `svg-to-png.ts` / `test-playwright.ts`
- 旧 spec (`docs/spec/*`、`docs/dev-plan.md`、`docs/design*.md`、`docs/refactor-*.md`) は `docs/archive/` へ移動
- `scripts/deck/` (ロゴ生成) は残す。出力先を md への貼り付けから `benben/images/<deck>/` へのファイル書き出しに変える

旧実装は削除前にタグ `nun-v1` で保存する。

## 一覧ページ

- `public/index.html` を手書き。デッキ名と `/<deck>.html` へのリンクを並べるだけ (サムネイルなし)
- デッキを追加したら 1 行追記する運用

## 捨てる機能 (必要になったら再検討)

wasd / Enter / ホイール / 左右クリックの操作、cursor-jack、zoom-fit、レスポンシブ (portrait 切り替え含む)、OGP 画像・サムネイル生成、全スライド WebP、PDF の mutool 圧縮、admonition、コードフェンスのファイル名・行番号・diff・コピーボタン、OGP カード、脚注のツールチップ、mermaid、favicon アニメーション、画像の round / mono / dim。

## リスク

- **URL の変更**: 旧 `/<deck>/` → 新 `/<deck>.html` (Cloudflare Pages では `/<deck>` でも配信される)。共有済みの cool-game の URL を生かすため、デプロイのフェーズで `public/_redirects` による転送を入れ、旧 URL で開けることを確認する
- **`<object>` の SVG**: 上記の通りフェーズ 1 で検証。Safari での描画は Marp 自身が experimental 扱いの領域なので、主要ブラウザ (Chromium) で確認できれば可とする

## フェーズ

各フェーズの終わりで build と dev が動く状態にする。

0. **保存**: タグ `nun-v1` を打つ。旧 docs を `docs/archive/` へ移動
1. **骨格**: marp-cli 導入、`marp.config.mjs`、最小テーマ、`<object>` SVG の検証。`src/` と旧依存を削除し、`package.json` の scripts を差し替える。Quaver を Marp 記法に書き換えて dev / build が通る
2. **cool-game 移行**: 書き換え表に従って移行。SVG を外部ファイル化し、`scripts/deck/` の出力先を変更。非公開スライドを退避
3. **テーマ**: 旧デザインを `nun.css` に移植し、cool-game の見た目を旧版と同等にする
4. **サイト化**: `public/index.html`、ビルド時のコピー、`_redirects`、`deploy.ts` の簡素化、PDF コマンド。本番デプロイして旧 URL を確認
5. **ドキュメント**: `CLAUDE.md` / `README.md` を新構成に書き直す。不要になった spike (`docs/research/marp-spike/`) は記録として残す
