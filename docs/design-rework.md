# デザイン・CSS リワーク計画

パイプラインや基本機能 (Phase 1〜13) は一通り動くようになったが、**見た目とレイアウトに複数の課題**がある。本書は課題を一覧化し、修正順序を明文化するものとする。

設計哲学そのものは `docs/design.md` に従う (CUBE CSS / Grid-First / Slide-scoped tokens)。本書はそれを踏まえた**修正タスク集**。

---

## 初期課題一覧 (発端の分析)

サンプルデッキ (`benben/sample.md`) を全 13 スライドキャプチャして洗い出した。重さで分類:

### Critical — このまま見せられない

| # | 課題 | 影響スライド | 根本原因の仮説 |
|---|---|---|---|
| C1 | **zoom-fit が機能していない/効きすぎ** — コンテンツが次の見出しに被る/切れる | 7, 8, 9 | client/index.ts の zoom-fit ロジック、または body の grid 設計 |
| C2 | **me テンプレ アイコン 404** | 4 | `/images/icon.png` 不存在 |
| C3 | **縦型カード (`.v`) が空プレースホルダ** | 12 | OGP fetch が dev/preview で機能していない可能性 |
| C4 | **横型カードのレイアウト分離** — title/desc/url が別枠に見える | 12 | `card.css` の枠/余白設計 |
| C5 | **solo テンプレでタイトル上端** — 中央配置されていない | 6, 13 | `templates/solo.css` の vertical alignment |
| C6 | **title テンプレで「中央左」が達成できていない** | 1, 3 | `align-content: center` が `grid-template-rows: auto 1fr` と干渉 |
| C7 | **footer テキストの clipping** | 全スライド | `footer.css` または SVG の overflow |

### Important — 品質

| # | 課題 | 場所 |
|---|---|---|
| I1 | **見出し色が全部 brand (#5932ff)** — 階層感ゼロ。h1 のみブランド、h2/h3 はトーン落とすべき | `templates/default.css` |
| I2 | **h2/h3 のサイズ差が小さい** (6cqmin vs 5cqmin) | `templates/default.css` |
| I3 | **admonition の整列がバラバラ** — アイコン (●) と本文インデントが揃わない、タイトル/本文の余白が大きすぎる | `admonition.css` |
| I4 | **コードブロック本文がほぼ不可視** — ヘッダーだけ見えて中身見えない | `code-block.css` + zoom-fit |
| I5 | **table が地味** — 罫線控えめ、ストライピング無し、padding 窮屈 | `templates/default.css` (`.body table`) |
| I6 | **脚注定義 [^N] が赤・モノスペース** — 浮いてる。本文の脚注参照 sup⁽¹⁾ も地味 | `footnote.css` |

### Polish — 細部

| # | 課題 |
|---|---|
| P1 | blockquote の縦罫線が控えめすぎ |
| P2 | ハイライト (`==`) の黄色がブランド (紫) と不調和 |
| P3 | nwyt (sub, lead) の余白設計 |
| P4 | ダークテーマ未検証 |
| P5 | table cell padding 窮屈 |
| P6 | リスト・ネストの余白 |

### Spec gap — 機能 / 仕様とのズレ

| # | 課題 |
|---|---|
| S1 | title テンプレの「固定画像」(右下に薄く) が意図通りか不明 |
| S2 | mermaid (slide 8 embed_mermaid) が描画されているか不明 (本体見えないので) |
| S3 | OGP meta タグに `thumb.webp` が組み込まれているか未確認 |

---

## 完了サマリ

時系列・依存関係順で進めたフェーズ。詳細は各コミットメッセージ参照。

### Phase A. zoom-fit を直す ✅ (`91d00c7`)

`article.default` 自体と `article.default > .body` の `min-height:0 / overflow:hidden` が原因で article が h2 のサイズに圧縮されていた。両方撤廃して解消。Critical C1 解決。

### Phase A2. コンテンツ密度 ✅ (`b1feeb4`)

サンプルを 13 → 23 スライドに分割し 1 スライド = 1 トピックの粒度に。zoom-fit は「想定オーバーの保険」の位置付けに戻す。スケール再検討・縮小発動閾値・縮小下限はいずれも実害なしと判断し**やらない**。

### Phase B. テンプレート修正 ✅ (`8df7c7f`)

`grid-template-rows: auto 1fr` の干渉で `align-content: center` が効かなかった問題を、各テンプレで rows を override (title: auto auto / solo: auto / message: auto auto auto) して解消。me アイコン 404 も `/henoheno.svg` 差し替えで対応。Critical C2/C5/C6 解決。

### Phase C. ブロック要素 ✅

- card 横型レイアウト分離: 親 `<p>` の adoption agency による分裂を post-process で unwrap (`bf68877`)
- card 画像の `loading=lazy` 撤廃 (capture 信頼性) (`bf68877`)
- admonition / code-block 本文表示: Phase A で zoom-fit 修正により解消、追加 fix なし
- 派生: table の section 高さ stretch (`d97bb15`) / table font-size 継承 (`54842a8`) / mermaid 描画 16x16 問題 (`4319335`) / message リード強調 (`2663701`)
- 持ち越し: card の GitHub favicon 404 (要 hostname 別フォールバック)

### Phase D. タイポグラフィと色階層 ✅

- `.hierarchy` opt-in クラスで 4 段配色 (h1=brand / h2=strong / h3=main / h4-6=fg-mid) を提供 (`e668e64`)。デフォルトは brand 統一を維持
- h2/h3 サイズ差を 6/5 → 6.5/4.8 cqmin に拡大 (`075b610`)
- 脚注: 参照 sup を太字 brand、定義 `[^N]` を上寄せ + 太字 brand (`75b30e5`)

### Phase E. テーブル + モバイル レイアウト ✅ (table 一段落)

- table: 罫線 `color-mix(--main 30%, --base)` 強化 + padding 0.3em 0.6em + 角丸 0.4em (`ecea036`)。stripe / 見出し差別化はシンプル志向で**やらない**
- 派生: `--muted` を 96/4 に薄く (`c284ce3`) / diff 行二重改行 fix (`4b75c55`) / mobile dvh: section + body 100dvh で URL バー対応 (`2692a8b`, `4ab8746`)

### Phase F. Polish (主要 ✅、ダーク再撮のみ残)

- mark ハイライト: brand 透過 20→30% (`2739306`)
- ul/ol marker 整列 + checkbox カスタム描画 (`63a5c10`)
- blockquote 罫線 3→10px (`0225a99`)
- admonition リファイン: 罫線撤廃 + 全角丸 + `color-mix(type 9-10%, var(--base))` 低彩度 tint + title/dot を type 80% で抑制 (`d958a91`)
- nwyt 余白定数化、blockquote brand 寄せ、table cell padding は**やらない**判断 (シンプル維持)

### Phase Misc. テンプレ/ nwyt 範囲統一 ✅ (`a3608d1`, `271f5b4`)

spec (technical.md:163) は元から「heading 行〜次同レベル heading 行 -1」を共通範囲として規定していたが、実装が template 用の独自範囲を持ち、sample.md も「`🌊foo` を heading の前」に書く慣例だった。両方統一: `ScopeRange` 単一型に縮約、sample.md 全 25 箇所を heading 直下に移行。

---

## 直近セッションの状況メモ (2026-05-06)

前セッションで片付いたもの (時系列):
- テンプレ範囲を nwyt と統一 + sample.md 移行 (`a3608d1` `271f5b4`)
- OGP meta 一式 (`a75153e` `569571a` `9d37afc` `a90f3b4`) → og:image 1200x630 自動派生 + 絶対 URL 化
- table 中央寄せ `|:---:|` 対応 (`3fd4631`) + spec 明文化 (`7fcd905`)
- admonition リファイン (bg 4% + border 55%) (`bafa817`)
- blockquote 罫線太く (`0225a99`)
- mermaid SSG 化 (`ad0854f`) → bundle 数百 KB → 3.6 KB / head の modulepreload 大量タグ消滅
- admonition の折りたたみ記法を**思想として撤廃** (`bb5c1c0`) → `:::type+/-` 廃止、`<details>` 撤廃。スライドは静的メディア
- `!fn~[id]` (脚注定義) を section (h1) でも紐付くよう制約撤廃 (`3d25d00`) + spec 整え

このセッションで片付いたもの (時系列):
- 脚注 `!fn[id]` 参照側 adoption agency バグ修正 (`856d4d8`) → tooltip を `<template data-fn>` に詰めて parse 時の adoption agency を回避。fnDef body の block→inline 変換は不要となり丸ごと SSG 出力。client 側で起動時に `template.content` を clone して表示用 div に展開、hover で toggle
- 脚注 tooltip 配置・装飾改善 + `.head` opt-in 導入 (`df4e58c`) → tooltip を sup 子要素に置いて `position:absolute` 基点を確立、min/max-width 拡張 + shadow 弱化、`section.default > .body { overflow: hidden }` 撤廃で tooltip が body 端を越えてもクリップされない (section 自体の overflow:hidden で slide 外側はクランプ継続)。`!fn.head~[id]` で heading を tooltip に含める opt-in 追加、別ページ section 単位定義のサンプルも追加
- コードブロック copy / diff / 行番号整理 (`b071062`) → `extractCleanCode` で `.line` 単位 join + `.line-number` / `.diff-marker` 除外、copy ボタンのボーダー削除、diff の `\n` 剥がし & `display:block` 撤廃で非 diff と DOM 構造を統一 (`box-decoration-break: clone` で行幅着色は inline で対応)、`+`/`-`/` ` プレフィックスを `.diff-marker` 化して user-select:none + copy 除外、行番号幅を `--ln-width: <maxDigits>ch` で SSG 時に最大桁数ベースに自動調整、sample.md のコードブロックを基本系/埋め込み系の 2 ページに再編
- CLAUDE.md / docs 整理 (`db1e14e`) → CLAUDE.md の Commands 節に「dev server を作業終了時に停止」rule 追加、`design.md` ↔ 実装の乖離 3 件を `design-rework.md` 残作業に「docs ドリフト」として明文化
- blockquote `.brand-quote` opt-in 追加 (`4b908d4`) → `.hierarchy` 同様 section/article 単位の opt-in パターンで brand 色 blockquote を選択可能に
- card OGP/favicon を `open-graph-scraper` 化 (`a3c4ab0`) → 手書き regex パーサ (`getMetaContent` / `getFavicon` / `decodeEntities` 等) を全撤廃し v6.11.0 に置換。GitHub の favicon 404 解消 (`<link rel="icon" type="image/svg+xml" href="...githubassets.com/...">` を正しく取得)。仕様 (cache / timeout / UA / fallback) は維持

**進行中 (tmp commit `d686295`)**:
- `!bg~` / `!fbg~` バグ調査 + img レイヤー化リファクタ — 確実に動くバグ修正 (`extractImageSrc` 正規表現 / `appendFooter` 早期 return 順 / 2 重 `<use>` 削除) は適用済。`<img class="bg-layer / fbg-layer">` レイヤー化 (CSS 共通: `position:absolute; inset:0; object-fit:cover; pointer-events:none`、section bg-layer のみ `z-index:-1`) も入れたが fbg の visual が確認できてない (CSS mask が拾えてない/section-aspect クロップ揃え未着手)。次セッションで dev server 起動して目視からスタート

**次セッションの候補**:
- 進行中の `!bg~` / `!fbg~` を完成させる (visual 確認 + section-aspect クロップ揃え)
- footer text clipping (Critical C7) や mobile 1px 白帯など、コンテナ・レイアウト系の残作業
- テーブルの中央寄せ `|:---:|` `|---:|` 対応
- ダークテーマで全 23 スライド再キャプチャ (Polish P4)
- `design.md` ↔ 実装ドリフト 3 件の更新 (footer position:absolute / .fn-tooltip overflow / .body overflow:hidden 撤廃)
- title の固定画像位置/サイズ仕様明文化

## 2026-05-08 セッション進捗メモ

dark theme の baseline 整備に着手 (Polish P4 系の続き)。 fbg PDF を 「やらない判断」 として確定 (`project_fbg_pdf_strategy.md` 参照)、 並行して dark capture で複数バグを特定・修正。

このセッションで片付いたもの (時系列):
- fbg PDF 「やらない判断」 確定 (`6eca283`) — 4 アプローチ全敗、 screen 専用装飾と確定。 swap 実装 (`b0670be` `3e27ddd`) は revert (`7721753` `26a8b22`)
- URL query / capture `--theme dark` 入口 (`153a11e`) — `?theme=dark` で root に `data-theme` を立てる、 capture 側に `--theme dark` flag、 `dist/captures/<deck>/dark/N.webp` に振り分け
- body bg 修正 (`84ebee3`) — `body { background: var(--base) }` を追加。 元 token は定義のみで誰も使ってなかった、 dark theme 時に背景白のままになっていたため修正
- doctype 追加 (`58aeb93`) — `nun-structure.ts` の hast tree 先頭に `{ type: 'doctype' }` ノード追加。 doctype 欠落で Chromium が quirks mode に入り、 `<table>` の color 継承が壊れて dark で table text が真っ黒になっていた。 strict mode 復帰で全要素正常継承
- mark dark 強調化 → 統一 (`a5222a7` `7e98af4`) — 一旦 brand 50% に bump したが、 white 文字との合わせ技で overshoot 気味、 最終的に 「light と同じ 30% bg + white 文字」 で対称な強度に統一
- shiki dual theme + mark white (`4b722f5`) — `themes: { light, dark }` + `defaultColor: false` に切替、 code-block.css で `[data-theme="dark"]` 配下で dark 側の var に切替。 light は github-light、 dark は github-dark
- diff highlight 修復 (`e9264fb`) — shiki dual theme で `.shiki span { background-color }` を全 span に当てたため `.line.diff-add/del` の line bg が上書きされ消えていた。 `.shiki` 自体にだけ bg を当てる方向で修正、 dark の `--diff-add/del` を 8%→18% に上げ light と統一
- `.code-bare` opt-in (`2cfaf9e`) — 新規 `utils/code-bare.css`。 scope (section / article) に `.code-bare` で配下 `figure.code-block > figcaption` (lang label + copy ボタン) を非表示、 figure 枠は維持。 「コードを主役にしたいスライド」 用、 `.brand-quote` / `.window` / `.hierarchy` 同様の opt-in パターン
- shadow を black 基準に (`7e98af4` `393f22c`) — `--shadow` を `var(--main) 50%` から black 基準に変更。 `--main` 連動だと dark で「白い halo」 になっていた。 50% は dark canvas で識別不能だったため 70% (`393f22c`) に持ち上げた状態。 dark canvas 上で shadow を見せる本質的難しさは継続課題

**進行中 / 未確定**:
- shadow の dark 表示 (`393f22c` で 70% 黒だが、 「dark canvas に黒影」 は本質的に難しいテーマ。 別アプローチ — 例えば surface elevation で `.window` bg を canvas より一段明るくする、 brand-color glow 化、 border 強化 — を検討する余地)
- 全 32 dark スライドの目視 audit は未完 (table / code / mark / shadow 周りの修正後の確認は 2-3 枚分のみ、 残り 28 枚は次セッション)
- `.code-bare` の audit pending list 追加 (`project_class_audit_pending.md` に既存 `.hierarchy`/`.brand-quote`/`.window`/`.v`/`.head` と同列で)

**bun (Windows) + Playwright の注意 (`feedback_run_scripts_via_npm.md`)**:
script を `bun run scripts/foo.ts` 直走させると Windows で fd 3/4 継承失敗で必ず timeout する。 必ず `bun run capture` / `bun run pdf` 等 package.json 経由 (tsx / node-based) で実行。

**permission 拡張 (`.claude/settings.local.json`、 gitignore 済 local-only)**:
allow に `Bash(bunx tsx *)` と `Bash(rm -f scripts/_debug*)` を narrow pattern で追記。 broad な `bunx *` / `rm *` は引き続き ask 維持。

**進行中 (tmp commit `d686295`) — 詳細**:
- 既知バグ修正済 (確実に動く): `extractImageSrc` 正規表現 (`!\[` → `!?\[`)、`appendFooter` 早期 return 順 (bg を fl/fr 不在でも適用)、2 重 `<use>` 削除
- レイヤー化: `<section>` の inline style → `<img class="bg-layer">` 子要素、`<footer>` の inline style → `<img class="fbg-layer">` 子要素 + SVG defs (mask)。共通 CSS は `position:absolute; inset:0; width/height:100%; object-fit:cover; pointer-events:none`、`section > .bg-layer { z-index:-1 }`
- **未確認**: fbg-layer の visual。CSS `mask-image: url(#footer-mask-N)` が拾えてない可能性 (CSS bg 路線で「白で覆われてる」現象あり、img 路線後は目視未確認)
- サンプル: `benben/sample.md` slide 22 (`# 背景画像 — !bg~`) と slide 23 (`# フッター背景 — !fbg~`)、両方 `/images/tgs.jpg`
- 残課題: **bg と fbg を同じクロップで揃える** (section-aspect cover) — `background-attachment: fixed` 路線挫折、`object-fit: cover` でも footer アスペクトに引っ張られる。section の bg と同じ位置で footer の fbg を出すには「footer 内の img を section サイズで配置 + footer 領域でクリップ」要、別タスクとして残置

—

## 残作業

優先度・トピック別に再構築。

### コンテナ・レイアウト

- [ ] **footer text clipping** (Critical C7 残) — text-anchor / padding 見直し / SVG overflow visible
- [ ] **footer (mobile) 1px 白帯** — `html`/`body` の `height` と `100dvh` の subpixel 差で下地が露出。`html { height: 100dvh }` (`043444f`) と `html/body { background: var(--base) }` (`3d16b81`) を試したがどちらも効かず revert (`2846d9c`)。実機ローカルで再調査予定
- [x] **テーブルの中央寄せが効いてない** (`3fd4631`) — `<th align="center">` 等の HTML 属性は remark-gfm が出していたが、 `.body th, .body td { text-align: left }` が UA stylesheet の align 属性マッピングを上書きしていた。 `.body th[align="center"]` / `[align="right"]` 属性セレクタで明示的に text-align を指定して解決 (`body.css:94-97`)。 サンプル: `benben/initiation.md:312-316` の table ページに left/center/right 3 カラム例あり
- [x] **コードブロックのコピーボタン padding-l** (`b071062`) — copy ボタンのボーダー撤廃 (`border: 0`)、hover bg だけで浮かす形に。あわせて copy 動作 (改行落ち / 行番号 prefix 混入 / diff `+`/`-` 混入) を全て `extractCleanCode` で吸収

### スクリプト・出力品質

- [ ] **ダークテーマで全 23 スライド再キャプチャ** (Polish P4 残) — Phase D/E/F の色階層・muted・accent 等の dark 時挙動確認
- [x] **mermaid 描画完了待ち** (Spec S2 残) — そもそも client-side mermaid を撤廃し、build 時に Playwright で SVG 静的化する SSG 化で根治 (`ad0854f`)。capture 側の `mermaidReady` 属性待機は SSG 互換のために残置 (`b7e620d`)。bundle / modulepreload からも mermaid 関連 chunks が消える副次効果あり
- [x] **OGP meta 確認・追加** (Spec S3 残) — `nun-structure.ts` の shell 生成を拡充。`og:title` / `og:description` / `<meta name=description>` / `og:type=website` / `og:url` / `og:image` / `twitter:card=summary_large_image` を出力。`og:url` と `og:image` は Vite `base` + deck 名から自動派生 (`{base}{deck}/` と `{base}{deck}/thumb.webp`)、`meta.url` / `meta.image` / `meta.ogImage` で個別上書き可

### 機能・UI 細部

- [x] **details (admonition) 開閉時の zoom-fit 再計算** — 動的トグル自体を廃止する方向で解消。`:::note+` / `:::note-` の折りたたみ記法と `<details>`/`<summary>` 出力を撤廃し、admonition は常に `<div>` で静的出力。スライドという静的メディアに動的要素を持ち込まない方針に揃えた
- [x] **脚注 `!fn[id]` 参照側 (sup + tooltip) の adoption agency バグ** (`856d4d8`) — `<span class="fn-tooltip" hidden>` 路線では sup の置き場所が `<p>` の中であるため、tooltip 内の block (`<p>` 等) が adoption agency で外側 `<p>` を強制 close → tooltip が DOM 上でリフトされ `hidden` が外れた状態で本文混入していた。**`<template data-fn>` 路線**で解決: template 中身は parse 時に別 insertion mode に切り替わるため、どんな block でも外側を壊さない。fnDef body は変換ナシで丸ごと template に流し込む (block→inline 変換ロジック不要)。client 側は起動時に各 `template[data-fn]` の `.content` を clone して表示用 `<div class="fn-tooltip">` を隣に作り、hover で toggle
- [x] **blockquote brand opt-in クラス** — `🌊default.brand-quote` で section / article に `.brand-quote` を付けると、その scope 配下の blockquote が brand 色寄せ (`border-left-color: var(--brand) / color: var(--main)`)。デフォルトは引き続き控えめ (`border / fg-mid`)。`.hierarchy` と同じ section 単位 opt-in パターンで実装
- [x] **card の GitHub favicon 404** (Phase C 持ち越し) (`a3c4ab0`) — `nun-card.ts` の手書き OGP/favicon パーサを `open-graph-scraper` (v6.11.0) に置換して解消。GitHub の `<link rel="icon" type="image/svg+xml" href="...githubassets.com/favicons/favicon.svg">` も正しく取得できる。og:title/description/image/favicon のロジックがライブラリ実装に集約、エンティティデコード等のヘルパも撤廃

### Spec

- [ ] **title の固定画像位置/サイズ仕様を spec に明文化** (Spec S1 残) — `docs/spec/structure.md` の title テンプレート節に書き、実装と整合確認

### docs ドリフト (`design.md` ↔ 実装)

`design.md` は CSS 設計の道標として書かれた aspiration だが、実装過程で別解に倒れた箇所がある。要追従または design.md 側を更新。

- [ ] **footer の `position: absolute`** — `design.md` 4.5 / 11 は「footer は section grid の最終 auto 行に置く、position:absolute を使うな」だが、実装は `footer.css:3` で `position: absolute; inset-block-end: 0` を採用 (mobile dvh 問題対応の流れで)。grid 行に戻すか、design.md を「実装事情で absolute 採用」に修正するか
- [ ] **`.fn-tooltip` の overflow と max-width** — `design.md` 11 は「`overflow: hidden + max-width` で可変長を制御」だが、実装は `width: max-content / max-width: 50em` ベース (overflow 設定なし)。design.md 側を実装に合わせる
- [ ] **`section.default > .body { overflow: hidden }`** — `design.md` 11 「.body は `min-height:0; overflow: hidden`」だったが、tooltip overflow 対応で `overflow: hidden` を撤廃 (`templates/default.css`)。design.md 側を更新

---

## やらない判断 (recorded)

### fbg の PDF 互換 (screen 専用と確定 — 2026-05-07)

`!fbg~` (footer background image) を PDF 出力でも screen と同じ見た目に焼きたかったが、 Chromium PDF backend のバグ群が複合して **構造選択でも DOM swap でも fix できない**と検証で確定。 fbg は **screen 専用装飾**として割り切る。

検証で却下された 4 アプローチ (再挑戦時は memory `project_fbg_pdf_strategy.md` 必読):

1. `<svg class="fbg-layer">` + `<image mask=url(#m)>` + cross-svg `<use href>` (`0e0579b`) — Chromium PDF backend が cross-svg `<use href>` を resolve しない既知バグ
2. mask 内 shape を inline 化 + CSS transform で位置調整 (`b8dfe0a`) — mask 内の indirectly-rendered 要素への CSS transform は PDF backend で適用されない
3. PDF 時に `display: none` で fbg を隠す — 思想として却下、 「逃げ過ぎ」 判断
4. `scripts/pdf.ts` の `page.evaluate()` で fbg DOM を `<svg>` + `<clipPath>` + `<image clip-path>` 構造に swap (`b0670be` / `3e27ddd`) — mask は適用されたが visual がズレ / 不正、 検証で 「ダメ」 確定

screen 側は `<div class="fbg-layer">` + `<img class="fbg-img">` + `<svg class="fbg-svg">` + CSS `mask-image: url(#fragment)` で確定 (`53eb5c2`)。 bg-layer と画像 CSS 共通化、 dark theme 対応 (`--shape-fill: white` 固定)。

PDF 出力時の fbg は仕様外 (PDF では fbg が真っ黒 / 表示されない / ズレる等の現象が発生し得るが、 仕様として受け入れる)。 将来 Chromium PDF backend が SVG mask / clip-path resolution を改善したら再挑戦の余地あり。

---

## 完了基準

- 全スライド (light/dark 両方) のキャプチャを並べて見て、**読めない/崩れているスライドが 0**
- 各 Phase 完了後にキャプチャを取り、Discord に共有してレビュー → 次フェーズ
