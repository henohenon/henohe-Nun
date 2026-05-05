# デザイン・CSS リワーク計画

パイプラインや基本機能 (Phase 1〜13) は一通り動くようになったが、**見た目とレイアウトに複数の課題**がある。本書は課題を一覧化し、修正順序を明文化するものとする。

設計哲学そのものは `docs/design.md` に従う (CUBE CSS / Grid-First / Slide-scoped tokens)。本書はそれを踏まえた**修正タスク集**。

---

## 課題一覧

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

## 進行プラン

依存関係と影響範囲を考えてフェーズ化する。**早いフェーズの修正で後段の問題が見えにくくなる**ため、毎フェーズ後に全スライドを再キャプチャして次フェーズの内容を再評価する。

### Phase A. zoom-fit を直す ✅

→ Critical の C1 が複数のスライドで二次的影響を出している (本来見えるはずの本文が切れて評価できない)。最優先で根本対処。

- [x] zoom-fit のクライアント JS (`src/client/index.ts` `initZoomFit`) を読み解く
- [x] body の `grid-auto-rows: auto` + `gap` + `min-height: 0` が想定通り潰れているか確認
- [x] zoom が overflow した場合のスケール計算が正しいか
- [x] 全スライドで zoom-fit が破綻しないことを確認

**結論**: `article.default` 自体と `article.default > .body` の `min-height:0 / overflow:hidden` が原因で、article 全体が h2 のサイズだけに圧縮 → 本文が visually hidden、zoom-fit からも overflow が見えず縮小トリガー無し。両方の制約を撤廃して解消 (commit `91d00c7`)。

### Phase A2. コンテンツ密度・スケール調整 ✅ (一段落)

→ Phase A の修正で zoom-fit が機能した結果、**コンテンツの多いスライドではフォントが小さく縮みすぎる** 副次問題が顕在化。現状の `--text-body: clamp(14px, 5cqmin, 100px)` ベースは、sample デッキの「全機能デモ」を 1 スライドに詰めるとほとんど読めなくなる。

- [x] サンプル `benben/sample.md` の密度を見直す (1 スライドに詰める量を減らすか分割)
- [x] cqmin ベースのテキストスケールを再検討 — **やらない判断**。サンプル分割で実用上問題なくなったため現状維持。
- [x] zoom-fit が縮小発動する閾値の体感確認 — **やらない判断**。現状の挙動に大きな違和感なし。
- [x] 「これ以上は縮小せず overflow 切り捨て」の上限設定 — **やらない判断**。「ロマン」枠で無制限縮小を許容する方針。

判断: スライド = "1 トピック 1 枚" の原則を踏襲するなら、サンプル分割 + 適度な default scale で大半は解決。zoom-fit はあくまで "想定オーバーの保険" 位置付けに戻す。

**第一段** (sample 分割) 完了 (commit `b1feeb4`): 13 → 23 スライドに拡大、各スライドが zoom-fit 不要 or 軽い縮小で読める粒度に。残課題はいずれも実害なしと判断し、これ以上の介入はしない。

### Phase B. テンプレート修正 ✅

→ Critical の C5, C6 (テンプレートの中央配置)。Phase A で zoom-fit が正常化した後に着手 (干渉する可能性)。

- [x] title — 「中央左」を達成 (vertical center + max-width 65% は維持)
- [x] solo — タイトル中央配置 (vertical + horizontal)
- [x] me — アイコン 404 を /henoheno.svg に差し替え + parseNwytValue が `[alt](url)` (link syntax) も受け付けるよう修正
- [x] message — h1 + body + lead を縦中央寄せ

**結論**: base.css の `grid-template-rows: auto 1fr` が全 section を full fill するため `align-content: center` が機能しなかった。各テンプレで `grid-template-rows` を override (title: auto auto / solo: auto / message: auto auto auto) して残り空間を作り、center 効くようにする (commit `8df7c7f`)。

### Phase C. ブロック要素 ✅ (一段落)

→ Critical の C3, C4 + Important の I3, I4。

- [x] **card** — 横型レイアウト分離問題を修正。原因はブラウザの adoption agency: `<a class='card'><div></div></a>` が親 `<p>` のせいで分裂していた。card のみを含む `<p>` を unwrap する後処理で解決 (`bf68877`)
- [x] **card** — 画像の `loading='lazy'` を撤廃 (capture 時に確実に描画)
- [ ] **card** — favicon が GitHub の場合 404 (`getFavicon` の URL 推定が GitHub の特殊形式を扱えない)。Phase F 候補
- [x] **admonition** — Phase A の zoom-fit fix で本文が表示されるようになり、整列の指摘は実用レベルに収まった (個別 fix なし)
- [x] **code-block** — Phase A で本文が見えるようになった。header/body 装飾は Phase D 以降

**Phase C 関連 + 派生して直したもの**:
- table 行が container 高さに stretch される問題: `section.default > .body` に `align-content: start` を指定 (`d97bb15`)
- table の font-size がブラウザ既定 medium で継承されず極小に: `table { font: inherit }` を base に追加 (`54842a8`)
- mermaid 描画時に section が display:none で SVG が 16x16 に縮小: 描画前に全 section を一時表示 (`4319335`)
- message リード強調 (E 案 → さらに強化、size 6.5cqmin + strong + tracking)

### Phase D. タイポグラフィと色階層 ✅

→ Important の I1, I2, I6。

- [x] 見出し色: 4 段配色 (h1=brand / h2=strong / h3=main / h4-6=fg-mid) を **`.hierarchy` opt-in** で提供。デフォルトは brand 統一を維持
- [x] 見出しサイズ: h2 6→6.5cqmin / h3 5→4.8cqmin に変更し差を広げた
- [x] 脚注: 参照 sup を太字 brand に、定義 `[^N]` を上寄せ (`vertical-align: top`) + 太字 brand の最小ラベルに

**Phase D 関連コミット**: `075b610` (size), `e668e64` (.hierarchy), `75b30e5` (footnote)

### Phase E. コンテナ要素 (table 一段落 / footer 未着手)

→ Important の I5 + Critical の C7。

- [x] **table** — 罫線を `color-mix(in srgb, var(--main) 30%, var(--base))` (≒ #c4c4c4) に強化 (table 局所変数 `--table-border-color` で他 `--border` 利用箇所には波及させない)。cell padding を 0.25em 0.55em → 0.3em 0.6em に微増。`border-collapse: separate` + `border-spacing: 0` + `border-radius: 0.4em` + `overflow: hidden` で角丸対応 (`ecea036`)。**stripe と見出し行差別化はシンプル志向のためやらない判断**。
- [ ] **footer** — テキストの clipping 対策 (text-anchor / padding 見直し、SVG overflow visible)
- [ ] **footer (mobile)** — モバイルで footer 下に 1px の白い帯が見える事象。`html`/`body` の `height` と `100dvh` の subpixel 差で下地が露出していると推測。`html { height: 100dvh }` 化 (`043444f`) と `html/body { background: var(--base) }` (`3d16b81`) を試したがどちらも効かず、`2846d9c` で revert 済み。実機ローカルで再調査予定。

**Phase E 関連 + 派生して直したもの**:
- `--muted` を 1 段薄く (94/6 → 96/4)、code/inline/th/card/admonition の muted 背景の主張を抑制 (`c284ce3`)
- diff 行の二重改行を解消: `.diff-add` / `.diff-del` に `display: block` を当てた span 直後の `\n` テキストノードを削除 (`4b75c55`)
- モバイル (iPhone Chrome) で `100vh` が URL バー領域を含むため footer が画面外に出ていた問題を `section { height: 100dvh }` で解消 (`2692a8b`)
- 同上修正で section 上端が URL バーに重なるようになったため `body { height: 100dvh }` も追加して可視領域全体に揃える (`4ab8746`)

### Phase F. Polish (一部進行中)

→ Polish の P1〜P6。

- [x] **blockquote**: 縦罫線を 3px → 10px に倍以上太く (`0225a99`)。色は `--border` のまま、italic + fg-mid 維持。admonition と機能的に被らないシンプルさ優先。`--brand` 寄せや別 token は **やらない判断**
- [x] **ハイライト (`mark`)**: brand 透過 20% → 30% に強める (`2739306`)
- [x] **nwyt 余白の定数化** — **やらない判断**。各テンプレートの余白は em ベースで font-size 連動しており重複も少なく、共通化の得は小さい
- [ ] ダークテーマで全スライド再キャプチャしてレグレッション確認
- [x] table cell padding 緩和 — Phase E で対応済 (`ecea036`)
- [x] **リスト・ネストの marker 整列** (`63a5c10`): ul/ol を `padding-inline-start` ベースに揃え、`<input type=checkbox>` を `appearance: none` + brand 枠 + チェック時 brand 塗り + 白 ✓ にカスタム描画

**Phase F 関連 + 派生で直したもの**:
- **admonition** リファイン (`d958a91`): 左罫線撤廃 + 四隅角丸 + bg を `color-mix(type 9-10%, var(--base))` の低彩度 tint に。title/dot は `color-mix(type 80%, var(--base))` で抑える。元の tailwind 風飽和度 (#4b70ff / #22c55e / #f59e0b / #ef4444) は data として保持しつつ全体トーンを slide の落ち着き寄せ

### Phase G. Spec gap

→ Spec の S1〜S3。

- [ ] title の固定画像位置/サイズ仕様を spec に明文化、実装と整合
- [ ] mermaid の描画完了待ちを capture スクリプトに導入 (現状 networkidle + 150ms では足りない可能性) → `await mermaid.run` 完了マーカーで wait
- [ ] OGP meta が出ているか確認、出てなければ `nun-structure.ts` に追加

### Phase H. 要追加調査 (メモ書き)

セッション中に oneline で挙がった気になり点。詳細・再現条件は要確認。

- [ ] **テンプレ指定が想定と違う / prop も違いそう** — どの template / どの prop が spec と合わないか具体例を集める。`docs/spec/syntax.md` の templates セクションと現挙動の差分を洗う作業
- [ ] **コードブロックのコピー、padding-l** — copy ボタン周りのパディング問題？コピー範囲が狭い／広すぎる？要再現
- [ ] **テーブルの中央寄せが効いてない** — Markdown の `|---:|` (右寄せ) や `|:---:|` (中央) のアライメント指定が現状 CSS で打ち消されてる可能性。`.body td[align="center"]` 等の対応が必要かも
- [ ] **閉じる開くの zoom-fit** — `<details>` admonition の開閉で zoom-fit が再計算されない問題。`details` の `toggle` event をフックして fitSlide 呼び直す必要あり
- [ ] **脚注 none** — 表示されない事例があるらしい。`fn-tooltip[hidden]` の display 制御か、参照→定義のリンク切れか、要再現
- [ ] **blockquote の brand 版のための class 指定？** — `.brand` 等の opt-in クラスで brand 寄せ blockquote を可能にする案？シンプル維持の方針で見送ったが、必要なら opt-in 形で残す手

---

## 完了基準

- 全 13 スライドのキャプチャを並べて見て、**読めない/崩れているスライドが 0**
- ダークテーマでも同じこと
- 各 Phase 完了後にキャプチャを取り、Discord に共有してレビュー → 次フェーズ
