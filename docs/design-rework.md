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

このセッションで片付いたもの:
- 脚注 `!fn[id]` 参照側 adoption agency バグ修正 (`856d4d8`) → tooltip を `<template data-fn>` に詰めて parse 時の adoption agency を回避。fnDef body の block→inline 変換は不要となり丸ごと SSG 出力。client 側で起動時に `template.content` を clone して表示用 div に展開、hover で toggle
- 脚注 tooltip 配置・装飾改善 + `.head` opt-in 導入 (`df4e58c`) → tooltip を sup 子要素に置いて `position:absolute` 基点を確立、min/max-width 拡張 + shadow 弱化、`section.default > .body { overflow: hidden }` 撤廃で tooltip が body 端を越えてもクリップされない (section 自体の overflow:hidden で slide 外側はクランプ継続)。`!fn.head~[id]` で heading を tooltip に含める opt-in 追加、別ページ section 単位定義のサンプルも追加
- コードブロック copy / diff / 行番号整理 (`b071062`) → `extractCleanCode` で `.line` 単位 join + `.line-number` / `.diff-marker` 除外、copy ボタンのボーダー削除、diff の `\n` 剥がし & `display:block` 撤廃で非 diff と DOM 構造を統一 (`box-decoration-break: clone` で行幅着色は inline で対応)、`+`/`-`/` ` プレフィックスを `.diff-marker` 化して user-select:none + copy 除外、行番号幅を `--ln-width: <maxDigits>ch` で SSG 時に最大桁数ベースに自動調整、sample.md のコードブロックを基本系/埋め込み系の 2 ページに再編

**次セッションの候補**:
- `!bg~` / `!fbg~` (背景画像 / フッター背景画像) の動作確認・修正
- footer text clipping (Critical C7) や mobile 1px 白帯など、コンテナ・レイアウト系の残作業
- ダークテーマで全 23 スライド再キャプチャ (Polish P4)
- card の GitHub favicon 404 (Phase C 持ち越し)

—

## 残作業

優先度・トピック別に再構築。

### コンテナ・レイアウト

- [ ] **footer text clipping** (Critical C7 残) — text-anchor / padding 見直し / SVG overflow visible
- [ ] **footer (mobile) 1px 白帯** — `html`/`body` の `height` と `100dvh` の subpixel 差で下地が露出。`html { height: 100dvh }` (`043444f`) と `html/body { background: var(--base) }` (`3d16b81`) を試したがどちらも効かず revert (`2846d9c`)。実機ローカルで再調査予定
- [ ] **テーブルの中央寄せが効いてない** — Markdown の `|---:|` (右寄せ) や `|:---:|` (中央) のアライメント指定が CSS で打ち消されてる。`.body td[align="center"]` 等の対応が必要
- [x] **コードブロックのコピーボタン padding-l** (`b071062`) — copy ボタンのボーダー撤廃 (`border: 0`)、hover bg だけで浮かす形に。あわせて copy 動作 (改行落ち / 行番号 prefix 混入 / diff `+`/`-` 混入) を全て `extractCleanCode` で吸収

### スクリプト・出力品質

- [ ] **ダークテーマで全 23 スライド再キャプチャ** (Polish P4 残) — Phase D/E/F の色階層・muted・accent 等の dark 時挙動確認
- [x] **mermaid 描画完了待ち** (Spec S2 残) — そもそも client-side mermaid を撤廃し、build 時に Playwright で SVG 静的化する SSG 化で根治 (`ad0854f`)。capture 側の `mermaidReady` 属性待機は SSG 互換のために残置 (`b7e620d`)。bundle / modulepreload からも mermaid 関連 chunks が消える副次効果あり
- [x] **OGP meta 確認・追加** (Spec S3 残) — `nun-structure.ts` の shell 生成を拡充。`og:title` / `og:description` / `<meta name=description>` / `og:type=website` / `og:url` / `og:image` / `twitter:card=summary_large_image` を出力。`og:url` と `og:image` は Vite `base` + deck 名から自動派生 (`{base}{deck}/` と `{base}{deck}/thumb.webp`)、`meta.url` / `meta.image` / `meta.ogImage` で個別上書き可

### 機能・UI 細部

- [x] **details (admonition) 開閉時の zoom-fit 再計算** — 動的トグル自体を廃止する方向で解消。`:::note+` / `:::note-` の折りたたみ記法と `<details>`/`<summary>` 出力を撤廃し、admonition は常に `<div>` で静的出力。スライドという静的メディアに動的要素を持ち込まない方針に揃えた
- [x] **脚注 `!fn[id]` 参照側 (sup + tooltip) の adoption agency バグ** (`856d4d8`) — `<span class="fn-tooltip" hidden>` 路線では sup の置き場所が `<p>` の中であるため、tooltip 内の block (`<p>` 等) が adoption agency で外側 `<p>` を強制 close → tooltip が DOM 上でリフトされ `hidden` が外れた状態で本文混入していた。**`<template data-fn>` 路線**で解決: template 中身は parse 時に別 insertion mode に切り替わるため、どんな block でも外側を壊さない。fnDef body は変換ナシで丸ごと template に流し込む (block→inline 変換ロジック不要)。client 側は起動時に各 `template[data-fn]` の `.content` を clone して表示用 `<div class="fn-tooltip">` を隣に作り、hover で toggle
- [ ] **blockquote brand opt-in クラス** — シンプル版を維持しつつ `.brand` 等の opt-in クラスで brand 寄せ blockquote を選べる案。必要性が出たら検討
- [ ] **card の GitHub favicon 404** (Phase C 持ち越し) — `getFavicon` の URL 推定が GitHub の特殊形式を扱えない。`https://github.githubassets.com/favicons/favicon.svg` フォールバック or hostname ベース判定追加

### Spec

- [ ] **title の固定画像位置/サイズ仕様を spec に明文化** (Spec S1 残) — `docs/spec/structure.md` の title テンプレート節に書き、実装と整合確認

---

## 完了基準

- 全スライド (light/dark 両方) のキャプチャを並べて見て、**読めない/崩れているスライドが 0**
- 各 Phase 完了後にキャプチャを取り、Discord に共有してレビュー → 次フェーズ
