# Nun の Marp 移行 — 設計 (2026-10-03)

前提となる議論: `docs/journal-2026-09-29-marp.md`、試作: `docs/research/marp-spike/`。

## 方針

- **純粋な Marp で作る**。marp-cli + 自前テーマ CSS + `--html` のみ。独自 engine / markdown-it プラグイン / 記法の糖衣は書かない
- md は Marp 標準記法で書く。Nun 記法 (🌊 / nwyt / `~~~meta` / `:::` / `==mark==` / `embed_*` 等) は全廃
- 素の Marp で足りないと感じたら、その時に改めて拡張を検討する (今回の範囲外)
- Marp の外で作るのは **一覧ページ (手書き HTML)、ビルド後の処理 (ファイルコピー、旧 URL の転送ページ、画面合わせと操作のスクリプトの差し込み)、CI** だけ

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
marp.config.ts              marp-cli 設定 (html: true, themeSet 等)
scripts/postbuild.ts        ビルド後の静的ファイルコピー、旧 URL の転送ページ生成、deck-runtime.ts の差し込み
scripts/deck-runtime.ts     本番 HTML に差し込むブラウザ用スクリプト (画面合わせと操作)
.github/workflows/deploy.yml  GitHub Pages への公開 (main への push で実行)
dist/                       ビルド出力 (git 管理外)
```

- 画像を `benben/` 配下に置くのは、dev サーバー (`marp -s benben`) が `benben/` を静的配信するため
- 画像は **相対パス** (`images/...`、SVG 内からは `../engines/...` 等) で参照する。絶対パス `/images/...` は PDF 変換 (file://) で解決できないため。相対パスなら dev / `dist/` / PDF のすべてで解決する
- 一覧ページを `public/` に分けるのは、dev では `/` に Marp のディレクトリ一覧を出したいため (`benben/index.html` があると `/` がそれに置き換わる)

## コマンド

| コマンド       | 中身                                                                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp run dev`   | `marp -s benben` (サーバーモード。`/<deck>.md` を開くと都度変換、`?pdf` 等で各形式)                                                                                                                                                                                                           |
| `vp run build` | `marp -I benben -o dist --template bare` → `scripts/postbuild.ts` で `benben/images` と `public/` を `dist/` へコピーし、旧 URL 用の転送ページを生成し、デッキの HTML に `scripts/deck-runtime.ts` を差し込む (シェルの `cp` の挙動差に依存しないよう TS で書き、Node 標準の TS 実行で動かす) |
| `vp run pdf`   | `marp -I benben -o dist --pdf`                                                                                                                                                                                                                                                                |

- パッケージ管理・Node のバージョン (`.node-version`)・タスク実行・整形 / lint / 型チェック (`vp check`) は Vite+ (`vp`) + pnpm。Vite+ の設定は `vite.config.ts` (lint / fmt のみで、Vite でのビルドはしない)
- marp-cli の共通オプションは `marp.config.ts` (`defineConfig` で型付き) に書き、コマンドを短く保つ。marp-cli はローカルの TypeScript (v6 まで) で変換して読むので、TypeScript を v7 以上に上げる時は確認する
- 出力は `dist/<deck>.html` (フラット)。旧 Nun の `dist/<deck>/index.html` とは URL が変わる (後述のリスク)

## 公開

- 本番は GitHub Pages (`https://henohenon.github.io/henohe-Nun/`)。`.github/workflows/deploy.yml` が main への push で `vp check` → `vp run build` → `vp run pdf` → `dist/` を公開する
- PR ではビルドと PDF 生成だけ実行し、公開はしない (マージ前に CI が通ることを確認するため)
- サイトは `/henohe-Nun/` 配下に置かれるので、一覧ページ・デッキ内の参照はすべて相対パスにする

## 本番 HTML の画面合わせと操作 (2026-11-01 追加)

本番の HTML は `marp --template bare` で出力し、Marp 標準の操作 (bespoke テンプレート: ボタンの帯、キー操作、一覧表示、発表者ビュー、発表者メモ) を持たない。代わりに `scripts/postbuild.ts` が `scripts/deck-runtime.ts` の関数のソースを `dist/<deck>.html` の `</body>` 直前に `<script>` として差し込む。差し込むのはビルド後の HTML だけなので、PDF と dev サーバー (`vp run dev`、bespoke のまま) には効かない。

### 画面に合わせる

Marp の HTML は 16:9 固定で、他の比率では黒帯が出る。スライドの枠を画面と同じ縦横比に作り直す。調査の記録は `docs/research/responsive-spike/`。

- 書き換えるのは各スライドの `viewBox`、`foreignObject` の `width` / `height`、`section` の `style.width` / `style.height` だけ (テーマの `width: 1280px` は `!important` なしなのでインラインで上書きできる)。CSS の追加や自動縮小 (fit) はしない
- 枠 (仮想キャンバス) の大きさは、面積を 1280×720 に揃え、短い辺は 720 を下回らせない。画面への拡大縮小は `viewBox` 任せ
  - 面積を揃えるので、文字の大きさは画面の広さに比例し、画面の形を変えてもなめらかに変わる
  - 短い辺の下限は、横長 (スマホ横・超横長) で高さが 720 を割って下が溢れるのを防ぐため。16:9 より横長では高さ 720、9:16 より縦長では幅 720 になる
  - 16:9 の画面では従来と同じ 1280×720
- `resize` で作り直す
- 既知の溢れ (全 43 枚中): 4:3 で 1 枚 (8px)、タブレット縦で 1 枚 (表)、列の多い表が縦長・正方形で右に切れる。比例のさせ方では直らないので、必要になったら fit か表の扱いを別途考える

### 操作 (旧 Nun の navigation / cursor-jack)

- 1 枚ずつ表示し、`#N` でページを管理する (他のスライドの svg は `display: none`)。切り替えは View Transition (対応ブラウザのみ)
- 次へ: `→` `↓` `Space` `d` `s`、前へ: `←` `↑` `a` `w`、`Home` / `End` で最初 / 最後、`Enter` でフルスクリーンの切り替え
- 横に 50px 以上のスワイプ、30px 以上のホイール (300ms は次を受け付けない) で前後へ
- フルスクリーン中だけ、画面の左半分クリックで前へ・右半分で次へ。リンク等の上では送らない
- フルスクリーン中だけ、カーソルを半透明の円 (cursor-jack) にする
- `<object>` の SVG の中の入力はページに伝わらないため、同一オリジンで中の文書に触れる場合は同じ操作を付け、座標をページに直す (file:// で開いた場合は SVG の上だけ操作が効かない)
- 発表者ビュー・一覧表示・ブラウザの印刷で全スライドを出す機能は持たない (配布は PDF)

## 記法の書き換え表

| 旧 Nun                                   | Marp                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `#` によるページ区切り (空の `#` を含む) | `---` で区切る。`headingDivider` は使わない。空の `#` は削除                                               |
| スライド内の `##` / `###`                | そのまま (1 枚の中の見出しとして描画される)                                                                |
| `~~~meta` (title / description / date)   | front-matter。`title` は省略可 (最初の見出しから自動で入る)。`description` は必要なら書く。`date` は捨てる |
| デッキ全体の `!fr~`                      | front-matter の `header:` (テーマで右下に配置)                                                             |
| `!fl~`                                   | `<!-- _footer: ... -->`。章の頭で以降に引き継ぐ場合は `<!-- footer: ... -->`                               |
| `🌊default`                              | 何も書かない (テーマの既定)                                                                                |
| `🌊title` / `🌊solo` / `🌊message`       | `<!-- _class: title -->` 等                                                                                |
| `!sub~` / `!lead~`                       | HTML を直接書く (`<p class="sub">` / `<p class="lead">`)                                                   |
| `==mark==`                               | `<mark>`                                                                                                   |
| `embed_html`                             | フェンスを外して HTML を直接書く                                                                           |
| `embed_svg`                              | 外部ファイル化して `<object>` で参照 (下記)                                                                |
| `!card[タイトル](url)`                   | 普通のリンク `[タイトル](url)`                                                                             |
| `!fbg~` / `!bg.*~=fbg`                   | 削除                                                                                                       |
| HTML コメントで隠した非公開スライド      | Marp では発表者メモとして出力されるため、md から外して `docs/drafts/` に退避                               |

### SVG の置き方

cool-game の `embed_svg` は内部に `<a href>` のリンクと `<image href="/images/engines/...">` の外部画像参照を持つ。`![](x.svg)` (= `<img>`) ではリンクも内部画像も効かないため:

1. **第一案**: `benben/images/<deck>/<name>.svg` に書き出し、`<object data="images/<deck>/<name>.svg" type="image/svg+xml"></object>` で参照する
2. **代替案**: 第一案が Marp のスライド (inline SVG の foreignObject 内) で正しく描画・クリックできなければ、`<svg>` を md に直接書く

フェーズ 1 の最初に第一案を検証して確定する。

## テーマ (`themes/nun.css`)

- キャンバス 1280×720 (`@size` 既定) で組む。cqmin / clamp による可変レイアウトは持ち込まない (画面の比率への対応は上記「画面に合わせる」で枠ごと作り直す)
- 旧 `src/styles/` の見た目 (文字組み、色の変数、フッター線、コードブロック、表) を px ベースで移植する
- class は **移行するデッキで使っているものだけ**: `title` / `solo` / `message`。`me` / `window` / `compare` / `table-zebra` は移植しない
- `header` (旧 `!fr`) は右下、`footer` (旧 `!fl`) は左下に配置する
- シンタックスハイライトは Marp 標準 (highlight.js) にテーマ側で色を当てる
- 見出し・`.sub`・`.lead` のサイズは section の font-size 基準の em。溢れるスライドは自動縮小 (旧 zoom-fit) の代わりに、md 側で `<style scoped>section { font-size: 28px; }</style>` と書いて全体を縮める
- 旧 solo は見出し以外を表示しなかったので、solo スライドの本文は HTML コメント (= 発表者メモ) にする
- `<object ...></object>` を 1 行で書くと `<p>` に包まれるため、テーマは `p:has(> object)` を伸縮させて SVG を残りの高さに収める

## 移行するデッキ

| デッキ                                            | 扱い                      |
| ------------------------------------------------- | ------------------------- |
| `cool-game-development-using-web-technologies.md` | 移行する (本番の LT)      |
| `Quaver.md`                                       | 移行する                  |
| `initiation.md` / `fonts.md` / `mobile-test.md`   | 削除 (旧実装のタグに残る) |

書き換えは手作業 (AI 含む) の一回きり。移行スクリプトは作らない。

## 削除するもの

- `src/` 全体、`vite.config.ts`、`uno.config.ts` (`tsconfig.json` は `scripts/` と設定ファイルの TS 用に残す)
- 依存: vite、unified / micromark / remark / rehype 系、hastscript、shiki、mermaid、mathjax、unocss、open-graph-scraper、playwright、sharp、pdf-lib
- `scripts/` のうち `capture.ts` / `pdf.ts` / `render-mermaid.ts` / `svg-to-png.ts` / `test-playwright.ts`
- 旧 spec (`docs/spec/*`、`docs/dev-plan.md`、`docs/design*.md`、`docs/refactor-*.md`) は `docs/archive/` へ移動
- `scripts/deck/` (ロゴ生成) は移行時は残したが、デッキの SVG は生成後に手で調整済みで再生成の出番が無いため 2026-11-01 に削除した (git の履歴に残る)

旧実装は削除前にタグ `nun-v1` で保存する。

## 一覧ページ

- `public/index.html` を手書き。デッキ名、`<deck>.html` と `<deck>.pdf` へのリンクを並べるだけ (サムネイルなし)
- デッキを追加したら 1 行追記する運用

## 捨てる機能 (必要になったら再検討)

zoom-fit、portrait 用の切り替え、OGP 画像・サムネイル生成、全スライド WebP、PDF の mutool 圧縮、admonition、コードフェンスのファイル名・行番号・diff・コピーボタン、OGP カード、脚注のツールチップ、mermaid、favicon アニメーション、画像の round / mono / dim。

## リスク

- **URL の変更**: 旧 `/henohe-Nun/<deck>/` → 新 `/henohe-Nun/<deck>.html`。GitHub Pages はリダイレクト設定を持てないので、`scripts/postbuild.ts` が `dist/<deck>/index.html` に転送ページ (`location.replace` で `#N` を引き継ぎ、meta refresh を併記) を生成する。旧 PDF の URL (`/<deck>/slide.pdf`) は引き継がない
- **`<object>` の SVG**: 上記の通りフェーズ 1 で検証。Safari での描画は Marp 自身が experimental 扱いの領域なので、主要ブラウザ (Chromium) で確認できれば可とする

- **画像書き出し**: `marp --images png` では `<object>` の SVG が描画されない (HTML と PDF は描画される)。画像書き出しは今回使わないので許容する

## フェーズ

各フェーズの終わりで build と dev が動く状態にする。

0. **保存**: タグ `nun-v1` を打つ。旧 docs を `docs/archive/` へ移動
1. **骨格**: marp-cli 導入、`marp.config.ts`、最小テーマ、`<object>` SVG の検証。`src/` と旧依存を削除し、`package.json` の scripts を差し替える。Quaver を Marp 記法に書き換えて dev / build が通る
2. **cool-game 移行**: 書き換え表に従って移行。SVG を外部ファイル化し、`scripts/deck/` の出力先を変更。非公開スライドを退避
3. **テーマ**: 旧デザインを `nun.css` に移植し、cool-game の見た目を旧版と同等にする
4. **サイト化**: `public/index.html`、ビルド後の処理 (コピー・転送ページ)、PDF コマンド、GitHub Pages の CI を marp-cli 版に書き直す。旧 Cloudflare 用のデプロイスクリプトは削除
5. **ドキュメント**: `CLAUDE.md` / `README.md` を新構成に書き直す。不要になった spike (`docs/research/marp-spike/`) は記録として残す
