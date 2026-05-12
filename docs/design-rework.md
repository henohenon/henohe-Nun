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
- shadow を `--main` 連動に戻して 40% へ (`4a35c8c`) — user 指示 「`--main` 連動のまま比率を下げたい」 を受けて theme 連動 (light=黒系 / dark=白系) に復帰、 過去 50% で halo が強すぎた分を 40% まで絞った。 18% / 30% は弱すぎ、 40% で OK 判断 (initiation slide 12 で確認)

**進行中 / 未確定**:
- 全 34 dark スライドの capture は取得済 (shadow 40% 反映後)。 通し目視 audit は 「全体レビュー」 タスク側に移譲
- `.code-bare` の audit pending list 追加 (`project_class_audit_pending.md` に既存 `.hierarchy`/`.brand-quote`/`.window`/`.v`/`.head` と同列で)

**bun (Windows) + Playwright の注意 (`feedback_run_scripts_via_npm.md`)**:
script を `bun run scripts/foo.ts` 直走させると Windows で fd 3/4 継承失敗で必ず timeout する。 必ず `bun run capture` / `bun run pdf` 等 package.json 経由 (tsx / node-based) で実行。

**permission 拡張 (`.claude/settings.local.json`、 gitignore 済 local-only)**:
allow に `Bash(bunx tsx *)` と `Bash(rm -f scripts/_debug*)` を narrow pattern で追記。 broad な `bunx *` / `rm *` は引き続き ask 維持。

**bg / fbg 動作確認済 (2026-05-09)**:
- 既知バグ修正済: `extractImageSrc` 正規表現 (`!\[` → `!?\[`)、`appendFooter` 早期 return 順 (bg を fl/fr 不在でも適用)、2 重 `<use>` 削除
- レイヤー化完了: `<img class="bg-layer">` (section 直下、 absolute z:-1) と `<div class="fbg-layer"> > [<img class="fbg-img">, <svg class="fbg-svg" mask>]` (section 直下、 absolute) の構成で確定 (`53eb5c2`)
- bg/fbg class propagation 追加 (`0395003`) — `!bg.class~` `!fbg.class~` で nwyt prop の class が img の className に流れる。 `:where(.bg-layer, .fbg-img)` で specificity 下げて UnoCSS class 上書き許可、 `nwyt-prop.ts` parser bug (`-` `_` 弾き) も修正
- visual: 直近 capture (slide 31/32) で動作確認、 user confirm 済 (2026-05-09)
- **残課題 (別タスク)**: bg と fbg を同じクロップで揃える (section-aspect cover)。 `object-fit: cover` だと fbg が footer アスペクトに引っ張られて section の bg とクロップ位置がズレる。 「footer 内の img を section サイズで配置 + footer 領域でクリップ」 が必要、 別 session で対応

—

## 2026-05-09 セッション進捗メモ

design.md ↔ 実装ドリフト 3 件の整理から開始、 そのまま **stage wrapper 構造改革** に発展。 DOM 構造を `<section.X> > [<div.stage> > [<h1>, <div.content>], <footer>]` に再設計し、 footer を absolute から grid item に移行、 旧 `.body` を `.content` に rename した。

このセッションで片付いたもの (時系列):
- 画像 class 指定 `!.class[alt](url)` 構文追加 (`d11f902` `ffd2c11`) — 既存 nwyt content の自然な拡張として key 省略 + class のみで `<img class="..." src=u alt=v>` を吐く。 UnoCSS が markdown source の class を scan するので utility 直書き OK (rounded-lg / opacity-50 / grayscale / hue-rotate-180 等で検証)
- bg/fbg の class propagation (`0395003`) — `!bg.class~[]()` `!fbg.class~[]()` で nwyt prop の class が `<img class="bg-layer ...">` に流れる。 並行して 2 件の前提整備 — `nwyt-prop.ts` classRest が `[a-zA-Z0-9]` のみで `-` `_` 弾いてた parser bug 修正、 `.bg-layer { object-position: center }` → `:where(.bg-layer, .fbg-img)` で specificity 下げて UnoCSS class 上書きを許可
- shadow 40% 確定 (`4a35c8c`) — `--main` 連動のまま 50% → 40% に絞る。 black 基準路線 (`7e98af4` `393f22c`) は user 意図と外れていたので revert
- design.md ドリフト 3 件解消 (`9efc9a2`):
  - drift 1 (footer absolute): **stage wrapper 構造改革** で解消。 section grid を `1fr auto` (stage / footer) に簡素化、 padding を section → `section > .stage` に移譲して footer の edge-to-edge を grid 内で達成
  - drift 2 (.fn-tooltip overflow): design.md 通り `overflow: hidden; max-width: 50em` に戻す (`width: max-content / min-width` 撤廃)
  - drift 3 (.content overflow:hidden): **却下**。 zoom-fit が `offsetTop+offsetHeight` 方式で overflow 検知してるので overflow:hidden で clip すると検知壊れて縮小発動しない。 design.md §11 側を 「visible 維持、 zoom-fit 経由で縮小」 に更新予定
- stage refactor 詳細 (`9efc9a2` `7578186` `f1082b2`):
  - templates.ts: 全 6 template の出力に `wrapStage` ヘルパで `<div class="stage">` を導入
  - base.css: section grid `1fr auto`、 stage baseline (display:grid / auto 1fr / min-height:0)、 heading selectors を `section/article > h*` から `.stage > h*` に移行
  - footer.css: `position: absolute` 撤廃、 grid item 化
  - body.css: 全 `.body X` selector を `.content X` に rename
  - utils/brand-quote.css: `.brand-quote .body` → `.brand-quote .content`
  - 全 template CSS: `.X >` から `.X > .stage >` に書き換え
  - zoom-fit.ts: target を `:scope > .body` から `:scope > .stage > .content` に変更
  - article.stage の padding を 0 に (`section > .stage` のみに padding 限定、 二重インセット解消) (`7578186`)
  - title の henoheno に `z-index: -1` を付与 (`f1082b2`、 layer 順序: bg < henoheno < (h1/sub) < footer < fbg)

**残課題**:
- design.md §4.5 (footer placement) / §11 (overflow management) を stage refactor 後の実装に合わせて更新 (済、 `660e206`)
- structure.md の DOM 構造記述を `section > [stage > [h, content], footer]` に更新 (済、 `660e206`)
- title の固定画像 (henoheno) 位置/サイズの spec 明文化 (Spec S1) (済、 `3f784e1`)

—

### iPhone Chrome 対応の調査・修正 (2026-05-09 後半)

user から 「mobile で calc 効いてない」 報告を受け、 mobile-test deck を新設して isolated test (T1-T13) で iOS Safari の SVG 制約を切り分けた。 結果以下の特性が判明:

**iOS Safari (= iPhone Chrome、 engine 強制 WebKit) の SVG 制約**:
- ✗ CSS `x` / `y` property を SVG geometry 要素 (`<text>` / `<rect>` / `<use>`) に適用しても **機能しない**
- ✗ CSS `translate` / `transform` の `%` を SVG 要素に対して計算する route (`transform-box: view-box` 明示しても) **機能しない**
- ✗ SVG attribute (`x` / `y` / `dx` / `dy`) の `calc()` は **どんな単位 (var / em / cqmin / literal px) を入れても機能しない**
- ✓ SVG attribute literal `100%` / `Xem` / `Xpx` (calc 抜き) は機能する
- ✓ SVG attribute `transform="translate(X Y)"` は user units (calc 抜き literal) で機能する

**確定した fix 群** (全部静的、 JS 不使用):
- `61a0495` footer fl/fr text を CSS positioning から SVG attribute (`x="0.6em"` / `x="100%" dx="-0.6em"` / `y="1em"` / `text-anchor="end"` 等の literal) に書き換え
- `d9f34c4` section の `height: 100vh` → `100vh; 100dvh;` で URL バー込みでなく visible viewport に追随
- `40a4ba0` (= `52393de` 等価) fbg mask の `<use>` 位置決めを **nested svg + 負 em literal** で表現: `<svg y="100%" overflow="visible"><use href="#shape" y="-1.2em" /></svg>`。 calc も var() も使わない構造で iOS 対応。 1.2em (body 基準) ≈ 6cqmin ≈ footer height で近似

**この調査用に追加された資産**:
- `benben/mobile-test.md` — 3 slide 構成の diagnostic deck
  - slide 1: cqmin / calc / color-mix / @supports の bar 比較
  - slide 2: SVG text 位置決め T1-T6 (CSS x / CSS translate / SVG attribute)
  - slide 3: SVG attribute calc バリエーション T7-T13 (literal px / cqmin / var / em の組み合わせ)
- `https://henohenon.github.io/henohe-Nun/mobile-test/` で deploy 済、 将来の iOS regression check に流用可

—

### 2026-05-09 後半: zoom-fit 改善 (進行中、 中断)

iPhone landscape で content cutoff (slide 2 で T5/T6 が footer 下に押し出される、 一般 slide も似た症状) への対処として zoom-fit の改善着手。 user と算法整理 + 4 つの改善 step を提案、 順次 commit して iPhone で iter 検証する流れで進めた。

**zoom-fit の現状理解** (整理):
- target = `:scope > .stage > .content` の direct children を見る
- 計測: 各 child の `offsetTop + offsetHeight` を max 取って container.offsetTop を引いたもの = 必要 height
- container.offsetWidth/Height は section の dvh から footer / heading / stage padding を引いた 1fr 値
- scale = container size / 必要 size、 < 1 なら CSS zoom 適用
- 再帰最大 10 iter (CSS zoom が children サイズも変えるので)

**呼び出し起点 (改修前)**:
- 初期表示 / hashchange / window.resize / beforeprint

**抜けてた起点 (= 仮説 bug source)**:
- font load 完了後の再 fit (webfont 確定で text 幅変わる)
- image load 完了後の再 fit (`<img>` 0×0 → 実 size grow)
- ResizeObserver による精密検出 (window.resize は viewport settle 前の race あり)
- DOM 動的変化 (Nun は SSG 中心なので skip)

**4 step 改善計画**:
1. **scrollHeight 切替** (`1f0296a`) — 計測を `child.offsetTop + offsetHeight` per から `container.scrollHeight` 直読みに変更。 last child の margin-block-end 漏れ解消。 軽微効果だが概念クリーン
2. **ResizeObserver** (`9eeb40d`) — `window.resize` listener を `ResizeObserver` で section 自体を watch する形に置換。 rotation / URL バー collapse の race 回避目的
3. **font load 完了 trigger** (`97c821e`) — `document.fonts.ready.then(() => sections.forEach(fitSlide))` で webfont 確定後に全 slide 再 fit
4. **image load 完了 trigger** (未実装) — 各 `<img>` の `load` / `error` event で section 再 fit

**検証結果**:
- step 1 (scrollHeight): user 「よかろ」 = 視認問題なし
- step 2 (ResizeObserver): user 「はい」 = 視認問題なし
- step 3 (font load): user **「ダメみたい」** + IMG_1904 (slide 3 portrait)
  - 症状: T7-T13 box が大半消失 (1 個 thin line のみ)、 判定 list の bold item が異様に巨大、 全体が 1 画面に詰まり overflow
  - 俺の仮説 (scrollHeight feedback loop): user 否定 (step 1 単独では問題なかった)
  - debug 機構を追加 (`14f4f37`、 `?debug` URL query で on-screen overlay + console.log) → iPhone 実値計測待ち

**中断時点の状況**:
- working tree clean、 `14f4f37` (debug overlay) が HEAD
- iPhone Chrome で `https://henohenon.github.io/henohe-Nun/mobile-test/?debug` 開いて画面上端の overlay 数値 (offsetW/H、 scrollW/H、 scale、 zoom の iter ごと推移) を screenshot で投げてもらえれば真因切り分け再開可
- 仮説候補 (再確認):
  - feedback loop (CSS zoom 適用後の measure 値が zoomed で報告される iOS bug): debug log で iter ごとの値を見れば即判定
  - 別 bug: log の値が想定と違う場合 (例: scrollHeight が 0、 offsetHeight が壊れる、 etc.)
  - step 3 の font.ready trigger 自体が問題 (例: ready resolve 時の DOM state で scrollHeight 異常値)

**次セッションでやること**:
- iPhone から debug overlay screenshot もらって 数値解析
- 真因確定後、 各 step の revert / 改修判断 (revert step 3 → step 2 まで戻る or zoom-fit 再帰条件の修正 or 全 revert + 別 approach)
- 解決後、 image load step (step 4) の追加検討

—

### 2026-05-11/12: bg/fbg default 縮小 + Quaver deck 整備 (進行中、 中断)

Quaver LT deck (`benben/Quaver.md`) を新規追加 (`c87d183`) した際に発覚した複数の問題への対応を順次進めたが、 最後の bg/fbg default 変更で **fbg が表示されない regression** が出て session 中断。

**完了した修正**:

1. **card 崩れ** (`36b4a5a fix(quaver)`) — `benben/Quaver.md` 側の書き方問題、 2 重原因:
   - `!card[](...)` の label が空 → OGP fetch 失敗時の fallback title が空文字 → `.card-title` 空表示
   - card 直後に空行無く後続 text と同 paragraph に居て `unwrapSingleChildParagraph` (card 単独 `<p>` のみ unwrap する仕様、 `src/rehype/nun-card.ts:65`) の対象外 → `<p>` 内に `display:flex` の `<a.card>` が混在 → layout 崩壊
   - fix: label を `[dotvoice]` に + card 行前後に空行

2. **fl/fr 両方なし時の footer 早期 return 撤廃** (`f0dff1e feat(footer)`) — `src/rehype/decorations/footer.ts` の早期 return ガード (「テキストゼロのフッターは罫線だけになり装飾過剰」 という旧仕様) を user 指示で撤廃。 fbg のみ指定したい slide でも footer 形状 (= fbg の mask 源) が出るようになる

3. **bg/fbg default の縮小 + 右下配置** (`f595957 feat(bg/fbg)`) — `src/styles/background.css`:
   - 旧: `.bg-layer, .fbg-layer, .fbg-img { inset: 0; width: 100%; height: 100%; object-fit: cover }` (section 全体覆い)
   - 新: `.bg-layer, .fbg-layer { right: 0; bottom: -10%; width: 80cqmin; height: 80cqmin; object-fit: contain }` (section の min(w,h) 80% の正方形 box を右下に置き、 下に 10% はみ出す形)
   - `.fbg-img` は `.fbg-layer` 内で `inset:0; width/height:100%` 維持 (= 縮小された 80cqmin box 内で全体フィット)
   - 個別 slide で section 全体覆いに戻したい場合は UnoCSS class (`!bg.object-cover~` 等) で override する想定

4. **Quaver deck の内容整備** (`e339343` typo / `55fc6bf` 次手追加 / `35816a6` 所感 article 分割 / `c89767f` ぷろだくと article 追加 / `a6c7060` meta date + global fl/fr 設定)

**fbg 表示されない regression (中断時点)**:

user 報告: 「fbg が、 動いてないっ」 (2026-05-11、 commit `a6c7060` 後)

build した `dist/Quaver/index.html` で DOM 構造を確認 → 想定通り出力されている:

```html
<footer><svg class="footer-svg"><g id="footer-shapes-1">
  <rect class="footer-rule"></rect>
  <text class="footer-fl" ...>Quaver</text>
  <text class="footer-fr" ...>2026/05/11</text>
</g></svg></footer>
<div class="fbg-layer">
  <img class="fbg-img" src="/.../quaver-mark.svg" alt="fbg"
       style="mask-image: url(#footer-mask-1); ...">
  <svg class="fbg-svg">
    <mask id="footer-mask-1">
      <svg y="100%" overflow="visible">
        <use href="#footer-shapes-1" y="-1.2em"></use>
      </svg>
    </mask>
  </svg>
</div>
```

**仮説** (未検証): `.fbg-layer` の `bottom: -10%` で box 全体が section 下端から 10% はみ出した結果、 mask 内 `<svg y="100%">` 由来の coordinate origin (box 下端) も section の外側に移動 → `<use y="-1.2em">` で持ち上がっても **mask shape が section visible 領域の下端ギリギリより外側に来ている**可能性。 結果 fbg-img が mask alpha=black (透過) の領域だけになり全消失する。

別の可能性:
- iOS 以外の Chrome / Firefox でも全消失なのか、 mobile だけなのか未確認
- mask 自体は機能してて、 単に「縮小されすぎて見えてない」 だけかもしれない (80cqmin box 内に 1.2em の footer 形状 → 視認できないサイズ)

**ユーザーへの確認待ち** (`1503329582298693642` で投げて未回答):
1. 「全く見えない」 vs 「画像見えるが footer 形状で抜かれてない」 どちら?
2. 修正方針:
   - A) `bottom: 0` にして box を section 内に収める (画像下端 = section 下端、 -10% はみ出し諦め)
   - B) `bottom: -10%` 維持 + mask shape の y を box 内 90% に補正 (画像はみ出し維持、 mask は section 下端で footer と整合)
   - C) fbg は元の section 全体覆い設計に戻す、 bg だけ 80cqmin / bottom -10%

**中断時点の状況**:
- working tree clean、 `a6c7060` が HEAD で push 済
- user は `https://henohenon.github.io/henohe-Nun/Quaver/` で見え方確認できる状態
- 次セッションは user の 1/2 回答待ち、 その後 A/B/C いずれかで `src/styles/background.css` と (B の場合) `src/rehype/decorations/fbg.ts` の mask 構造を再調整

**今回 commit 群** (`c87d183` → `a6c7060` の 8 commit):
- `c87d183` feat: add quaver
- `36b4a5a` fix(quaver): card 表記を修正
- `f0dff1e` feat(footer): fl/fr 両方無くても footer を描画
- `f595957` feat(bg/fbg): default を section min(w,h) 80% / 右下 -10% / contain に
- `e339343` fix(quaver): typo / 閉じカッコ
- `55fc6bf` feat(quaver): 「次」 を所感に追加 (後続 commit で再構成)
- `35816a6` feat(quaver): 所感を よかった / はんせい に分割
- `c89767f` feat(quaver): ぷろだくと article 追加
- `a6c7060` feat(quaver): meta date / global fl / fr を設定

—

## 残作業

優先度・トピック別に再構築。

### 全体レビュー

- [ ] **全体のデザインを手で見直す** — 個別の修正タスクは「報告された問題への反応」 ベースで進めてきたが、 一度全 slide を通して目視で違和感や改善余地を拾う必要がある。 light / dark 両 theme で 32 slide 流して、 ここまでの局所修正が想定外の副作用を生んでないか、 全体としてのトーン (色階層 / spacing / shadow / typography) が整ってるかを user の感覚でチェック

### コンテナ・レイアウト

- [x] **footer text clipping** (Critical C7 残) — `.footer-svg { overflow: visible }` 適用 + `text-anchor: end` で fl/fr の clipping は解消済。 直近 capture (slide 1/12/21 等) で全スライド fl/fr 表示確認、 task は stale だった (具体的 clip 例の repro なしで stale 判定、 2026-05-09)
- [~] **footer (mobile) 1px 白帯** — 暫定的に **deprioritize** (2026-05-09 user confirm)。 1px 白帯自体は気にしないで OK との判断
- [x] **mobile で calc 効いてない疑惑** (2026-05-09、 真因確定) — 真因は **iOS Safari での SVG 位置決め** に集約。 typography (clamp/cqmin) は実は機能しており影響なし。 footer の SVG text と fbg mask の `<use>` が CSS / SVG attribute 経由の位置決めで失敗 → 視覚的に 「calc 効いてない」 と誤認されてた。 mobile-test deck (T1-T13) で isolated test を構築、 iOS の SVG 制約を完全切り分けた上で fix 適用 (`61a0495` `d9f34c4` `40a4ba0`)
- [~] **iPhone landscape での width / zoom-fit 違和感** (進行中、 2026-05-09 着手 / 2026-05-10 中断) — zoom-fit の改善 step 1-3 を順次 commit + push したが、 step 3 後の検証で「test boxes 消失 + bullet bold 巨大化」 の regression 出現。 user 仮説否定で debug overlay (`14f4f37`) 仕込み、 iPhone での実値計測待ちで session 中断。 詳細は下の 「2026-05-09 後半 zoom-fit 改善」 節参照
- [~] **bg/fbg default 縮小後の fbg 非表示 regression** (進行中、 2026-05-11 着手 / 2026-05-12 中断) — bg/fbg を `80cqmin / 右下 bottom -10% / object-fit:contain` の default に変更後 (`f595957`)、 fbg が表示されない報告。 build 確認で DOM は想定通り、 仮説は mask coordinate が `bottom:-10%` 起因で section 外に出ている可能性。 user の症状確認 + 修正方針 (A/B/C) 回答待ちで session 中断。 詳細は下の 「2026-05-11/12」 節参照
- [x] **テーブルの中央寄せが効いてない** (`3fd4631`) — `<th align="center">` 等の HTML 属性は remark-gfm が出していたが、 `.body th, .body td { text-align: left }` が UA stylesheet の align 属性マッピングを上書きしていた。 `.body th[align="center"]` / `[align="right"]` 属性セレクタで明示的に text-align を指定して解決 (`body.css:94-97`)。 サンプル: `benben/initiation.md:312-316` の table ページに left/center/right 3 カラム例あり
- [x] **コードブロックのコピーボタン padding-l** (`b071062`) — copy ボタンのボーダー撤廃 (`border: 0`)、hover bg だけで浮かす形に。あわせて copy 動作 (改行落ち / 行番号 prefix 混入 / diff `+`/`-` 混入) を全て `extractCleanCode` で吸収

### スクリプト・出力品質

- [x] **ダークテーマで全 34 スライド再キャプチャ** (Polish P4 残、 `1b908b7` 後 / 2026-05-08) — `bun run capture --theme dark` で `dist/captures/initiation/dark/{1..34}.webp` を取得。 capture 自体は完了 (Discord に 4 batch で共有済)、 通し audit は 「全体レビュー」 タスクで実施
- [x] **mermaid 描画完了待ち** (Spec S2 残) — そもそも client-side mermaid を撤廃し、build 時に Playwright で SVG 静的化する SSG 化で根治 (`ad0854f`)。capture 側の `mermaidReady` 属性待機は SSG 互換のために残置 (`b7e620d`)。bundle / modulepreload からも mermaid 関連 chunks が消える副次効果あり
- [x] **OGP meta 確認・追加** (Spec S3 残) — `nun-structure.ts` の shell 生成を拡充。`og:title` / `og:description` / `<meta name=description>` / `og:type=website` / `og:url` / `og:image` / `twitter:card=summary_large_image` を出力。`og:url` と `og:image` は Vite `base` + deck 名から自動派生 (`{base}{deck}/` と `{base}{deck}/thumb.webp`)、`meta.url` / `meta.image` / `meta.ogImage` で個別上書き可

### 機能・UI 細部

- [x] **details (admonition) 開閉時の zoom-fit 再計算** — 動的トグル自体を廃止する方向で解消。`:::note+` / `:::note-` の折りたたみ記法と `<details>`/`<summary>` 出力を撤廃し、admonition は常に `<div>` で静的出力。スライドという静的メディアに動的要素を持ち込まない方針に揃えた
- [x] **脚注 `!fn[id]` 参照側 (sup + tooltip) の adoption agency バグ** (`856d4d8`) — `<span class="fn-tooltip" hidden>` 路線では sup の置き場所が `<p>` の中であるため、tooltip 内の block (`<p>` 等) が adoption agency で外側 `<p>` を強制 close → tooltip が DOM 上でリフトされ `hidden` が外れた状態で本文混入していた。**`<template data-fn>` 路線**で解決: template 中身は parse 時に別 insertion mode に切り替わるため、どんな block でも外側を壊さない。fnDef body は変換ナシで丸ごと template に流し込む (block→inline 変換ロジック不要)。client 側は起動時に各 `template[data-fn]` の `.content` を clone して表示用 `<div class="fn-tooltip">` を隣に作り、hover で toggle
- [x] **blockquote brand opt-in クラス** — `🌊default.brand-quote` で section / article に `.brand-quote` を付けると、その scope 配下の blockquote が brand 色寄せ (`border-left-color: var(--brand) / color: var(--main)`)。デフォルトは引き続き控えめ (`border / fg-mid`)。`.hierarchy` と同じ section 単位 opt-in パターンで実装
- [x] **card の GitHub favicon 404** (Phase C 持ち越し) (`a3c4ab0`) — `nun-card.ts` の手書き OGP/favicon パーサを `open-graph-scraper` (v6.11.0) に置換して解消。GitHub の `<link rel="icon" type="image/svg+xml" href="...githubassets.com/favicons/favicon.svg">` も正しく取得できる。og:title/description/image/favicon のロジックがライブラリ実装に集約、エンティティデコード等のヘルパも撤廃

### Spec

- [x] **title の固定画像位置/サイズ仕様を spec に明文化** (Spec S1 残) — `docs/spec/structure.md` の title テンプレート節に明記 (現状の `right: -10% / bottom: -70% / width: 80% / z-index: -1` を暫定値として記録)。 全体デザイン見直し時に再検討する旨も併記

### docs ドリフト (`design.md` ↔ 実装)

`design.md` は CSS 設計の道標として書かれた aspiration。 2026-05-09 の stage refactor で 3 件全部解消 (一部は実装側、 一部は design.md 側で着地)。

- [x] **footer の `position: absolute`** (`9efc9a2`) — stage wrapper 導入で解消。 section grid を `1fr auto` (stage / footer) に再設計、 padding を section → `section > .stage` に移譲することで footer は section 端で edge-to-edge を維持しつつ in-flow grid item として配置可能に。 design.md §4.5 の grid 配置原則に実装が追従
- [x] **`.fn-tooltip` の overflow と max-width** (`9efc9a2`) — design.md §11 通りに `overflow: hidden; max-width: 50em` に戻した (`width: max-content / min-width` 撤廃)。 tooltip 内 block 要素の表示は `<template data-fn>` 路線で別途解決済 (`856d4d8`) なので overflow:hidden で問題なし
- [x] **`section.default > .body { overflow: hidden }`** — **却下**。 適用すると zoom-fit が破壊される (zoom-fit は `offsetTop+offsetHeight` で content overflow を検知する方式、 overflow:hidden で clip すると detection が壊れて縮小発動しない、 検証済 `9efc9a2`)。 design.md §11 を 「`.content` は overflow:visible 維持、 zoom-fit が overflow を検知して縮小するポリシー」 に更新する形 (本 commit 後に design.md 側修正)

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
