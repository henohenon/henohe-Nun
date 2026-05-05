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

### Phase A2. コンテンツ密度・スケール調整

→ Phase A の修正で zoom-fit が機能した結果、**コンテンツの多いスライドではフォントが小さく縮みすぎる** 副次問題が顕在化。現状の `--text-body: clamp(14px, 5cqmin, 100px)` ベースは、sample デッキの「全機能デモ」を 1 スライドに詰めるとほとんど読めなくなる。

- [x] サンプル `benben/sample.md` の密度を見直す (1 スライドに詰める量を減らすか分割)
- [ ] cqmin ベースのテキストスケールを再検討 (フロア/天井、5cqmin が最適か、line-height との関係)
- [ ] zoom-fit が縮小発動する閾値の体感確認 (どこから読みづらくなるか)
- [ ] 「これ以上は縮小せず overflow 切り捨て」の上限設定を検討 (現状は無制限縮小 = 文字 1px まで縮む可能性)

判断: スライド = "1 トピック 1 枚" の原則を踏襲するなら、サンプル分割 + 適度な default scale で大半は解決。zoom-fit はあくまで "想定オーバーの保険" 位置付けに戻す。

**第一段** (sample 分割) 完了 (commit `b1feeb4`): 13 → 23 スライドに拡大、各スライドが zoom-fit 不要 or 軽い縮小で読める粒度に。残りの cqmin スケール再検討と縮小下限は Phase B 以降と並行して必要に応じ着手。

### Phase B. テンプレート修正 ✅

→ Critical の C5, C6 (テンプレートの中央配置)。Phase A で zoom-fit が正常化した後に着手 (干渉する可能性)。

- [x] title — 「中央左」を達成 (vertical center + max-width 65% は維持)
- [x] solo — タイトル中央配置 (vertical + horizontal)
- [x] me — アイコン 404 を /henoheno.svg に差し替え + parseNwytValue が `[alt](url)` (link syntax) も受け付けるよう修正
- [x] message — h1 + body + lead を縦中央寄せ

**結論**: base.css の `grid-template-rows: auto 1fr` が全 section を full fill するため `align-content: center` が機能しなかった。各テンプレで `grid-template-rows` を override (title: auto auto / solo: auto / message: auto auto auto) して残り空間を作り、center 効くようにする (commit `8df7c7f`)。

### Phase C. ブロック要素

→ Critical の C3, C4 + Important の I3, I4。

- [ ] **card** — 横型レイアウトを 1 つの枠 + 内部分割に統合。縦型は `.v` modifier で grid-template 切替
- [ ] **card** — OGP fetch が dev でも動くか (Vite preview/file:// 制約) を調査、必要なら fallback (キャプション風表示)
- [ ] **admonition** — `display: grid` で `[icon] [title|body]` の 2 カラム構成、アイコン縦中央、本文インデント揃え
- [ ] **code-block** — figure に枠/影、header と body のシームレス化、zoom-fit 内で本文が viewable になるサイズを保つ

### Phase D. タイポグラフィと色階層

→ Important の I1, I2, I6。

- [ ] 見出し色: h1 = brand、h2 = strong、h3 = main、h4-6 = fg-mid
- [ ] 見出しサイズ: h2/h3 のスケールを広げる (例: 6.5 vs 4.8 cqmin)
- [ ] 脚注定義の装飾: `[^N]` をシンプルなラベルに、参照 sup を太字 + brand 色

### Phase E. コンテナ要素

→ Important の I5 + Critical の C7。

- [ ] table — 罫線を `--border` から `--main 30%` 程度に強化、行ストライピング (`tbody tr:nth-child(even)`)、padding 余裕、見出し行の差別化
- [ ] footer — テキストの clipping 対策 (text-anchor / padding 見直し、SVG overflow visible)

### Phase F. Polish

→ Polish の P1〜P6。

- [ ] blockquote: 縦罫線を太く、`--brand` 系に寄せるか別 token を切る
- [ ] ハイライト (`mark`): 背景色をブランドと協調する色 (例: `color-mix(--brand, transparent 80%)`)
- [ ] nwyt 余白の定数化
- [ ] ダークテーマで全スライド再キャプチャしてレグレッション確認
- [ ] table cell padding 緩和
- [ ] リスト・ネストの marker 整列

### Phase G. Spec gap

→ Spec の S1〜S3。

- [ ] title の固定画像位置/サイズ仕様を spec に明文化、実装と整合
- [ ] mermaid の描画完了待ちを capture スクリプトに導入 (現状 networkidle + 150ms では足りない可能性) → `await mermaid.run` 完了マーカーで wait
- [ ] OGP meta が出ているか確認、出てなければ `nun-structure.ts` に追加

---

## 完了基準

- 全 13 スライドのキャプチャを並べて見て、**読めない/崩れているスライドが 0**
- ダークテーマでも同じこと
- 各 Phase 完了後にキャプチャを取り、Discord に共有してレビュー → 次フェーズ
