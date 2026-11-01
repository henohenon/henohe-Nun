# Marp 移行検討メモ (2026-09-29)

LT スライド「Web技術でイイ感じのゲーム開発」を作り終えて、「感触は悪くないが、もう少しコンパクトに改良したい」という動機から、既存の md2slide (Slidev / Marp) に乗る案を検討した記録。

試作一式は `docs/research/marp-spike/`。

## 結論

- **DOM 構造系 (heading 階層 → section/article 入れ子、article 単位のテンプレート) は撤廃し、h1 = 1 枚のフラットな形へ。**
- **レイアウトは基本 SVG に追いやり、SVG は md に埋め込まず外部パスで参照する。**
- この形なら **Marp で足りる**。Nun 独自に残るのは「若干の記法」と「エンジニアのエゴとしてのレスポンシブ」だけで、レスポンシブもやるなら Marp の `@size` 切り替えで十分 (やらなくてもいい)。
- 立ち位置は「最強のスライドツール」ではなく **「ある程度は AI と運用でカバーする、個人の軽量スライドツール」**。
- 未決: 記法 (🌊 / nwyt) をどこまで引き継ぐか、リポジトリをどうするか。

## 1. なぜ見直したか

最新デッキ (`benben/cool-game-development-using-web-technologies.md`) の使われ方:

- h2 以下の article はほぼ使っていない (h2 は 4 個)。構成はほぼ `# タイトル` + `🌊default/solo` + `!fl~` + リスト/表
- 空 h1 (`#`) が多用されていた = 「h1 がページ区切りを兼ねる」制約が効いている
- ロゴを段階表示するために、ほぼ同じ `embed_svg` を 6 回コピーしていた
- 627 行中 223 行 (約 36%) が `embed_svg` / `embed_html`。大半は `scripts/deck/gen-logo-map.ts` / `gen-lib-row.ts` の生成結果の貼り付けで、**真の元データはスクリプト側にあり、md には生成物が置かれていた**

heading 階層を実際に使っているのは主に `🌊compare` (fonts.md / initiation.md)。

## 2. Slidev / Marp で実現できないもの

| Nun の機能 | Marp | Slidev |
|---|---|---|
| heading 階層 → section / article 入れ子 | × | × |
| article 単位のテンプレート / nwyt | × | × |
| h1 でページ区切り | ○ `headingDivider: 1` | △ preparser |
| `🌊template` (DOM 構造切替) | △ class + CSS のみ | ○ layout (Vue slot) |
| グローバルスコープの継承 | ○ directive の継承 | △ headmatter は非継承 |
| `!fbg` (footer 形状マスク) | × | △ 自作コンポーネント |
| `!card` (ビルド時 OGP 取得) | △ 事前取得して同期で読む | △ Vite プラグインで事前取得 |
| `!fn` (tooltip + 定義スライドへ遷移) | △ スライド単位の定義なら可 | × スライド跨ぎが重い |
| 自動縮小 (zoom-fit) | △ 見出しの `<!--fit-->` のみ | △ 手動 `zoom:` |
| JS なしで読める静的 HTML | ○ | × SPA |
| 複数デッキ + 一覧 | △ 一覧は自前 | × 1 ビルド 1 デッキ |

- 両者共通で構造的に無理なのは「heading 階層を文書構造として扱う」系統のみ。Nun 独自の意義はほぼこの 1 点に集約されていた。
- Slidev は Vue を md に書く文化で、「Markdown に DOM/CSS を書かない」Nun の思想と逆向き。**比較対象から外す**。Marp の方が思想 (静的 HTML、md として読める) が近い。

## 3. Marp spike の結果

`docs/research/marp-spike/` (Marp CLI 4.5.1 / Marp Core 4.4.0)。

- `engine.mjs` (約 150 行) + `nun.css` (約 80 行) で、**Nun 記法のまま** (`🌊` / `!fl~` / `!fr~` / `!sub~` / `!lead~` / `:::note` / `==mark==` / `` ```ts:main.ts `` / `embed_svg` / `!card` / `!fn`) Marp で変換できた。Marp 記法で書いた版と出力 section が一致。
- `🌊` / `!key~` は **行単位の desugar** で Marp directive に書き換えている。`docs/comparison.md` で却下した「コンバーター案」と同系統だが、階層を捨てたので後処理が不要になり、却下理由の主因が消えた。
- 対応関係:
  - `!fl~` / `!fr~` → custom local directive (`fl` → footer、`fr` → header を CSS で右下へ)
  - スコープ内 `!fl~` → spot directive `_fl` (その 1 枚のみ) = Nun の意味と一致
  - グローバル (最初の h1 より前) → front-matter
  - `🌊tpl.cls` → `_class`。Marp の `_class` は置換なので、desugar でグローバル class を後ろに足して合成
  - `!sub` / `!lead` / `!icon` はテンプレート prop として扱えないので、本文要素に変換して CSS で配置
- `!card`: markdown-it は同期なので、OGP はキャッシュ JSON から読む。functional engine は async 可なので事前取得もそこで書ける。
- `!fn`: Marp は全スライドを 1 HTML に出すので、core rule で定義スライド番号を集めて `#N` リンクにできる。定義単位はスライドのみ (h2 article 単位の定義は不可)。
- 補足: Marp の非 spot directive は後続に継承されるので、`!fl~` を章頭 1 回だけ書く運用にすれば現状より短くなる (意味は変わる)。

## 4. Marp で確認したこと

### PDF (実測: 8 枚、写真 1 枚入り)

- 約 7 秒 (ブラウザ起動込み)、1.03 MB (うち約 880 KB が JPEG そのまま)
- テキスト選択・検索可、外部リンク・スライド内リンク (`!fn` → `#6`) とも有効
- `--pdf-outlines` でしおり、`--pdf-notes` で発表者メモを注釈として出せる (Nun には無い)
- Chromium の同じ仕組みなので画像の肥大化は Nun と同じ。`mutool clean` 相当の後処理は Marp に無いので、必要なら後段に足す
- はみ出しは切れる (縦長写真で下が切れ、その下のリンクも消えた)。テーマで `img { max-height }` か `![h:400]()` で運用対処

### 発表機能 (marp-cli の bespoke テンプレート)

- `f` / `F11` フルスクリーン、`p` 発表者ビュー (別窓: 現在 / 次スライド / メモ / 時刻 / 経過時間、localStorage で同期)、`o` / `Esc` 一覧表示、タッチ向け OSC、進捗バー、`*` 箇条書きの段階表示、View Transition
- キー割り当ては変更不可。Nun の Enter フルスクリーン / wasd / ホイール / 全画面時の左右クリックは無い
- **レーザーポインター系は無い** (操作が無いとカーソルを隠す機能のみ)。Nun の cursor-jack は数十行なので移植は容易
- 注意: Marp では directive でない `<!-- -->` が**発表者メモ**になる。cool-game デッキ末尾の「非公開の仮スライド」コメントは発表者ビューや `--pdf-notes` に出てしまうので、別ファイル化か desugar で除去が必要

### スマホ

- 操作面は対応: スワイプ (30px 閾値)、タッチ OSC、viewport meta、Wake Lock
- レイアウト面は非対応: 1280×720 固定を拡縮するだけ。縦持ちでは中央に横長の帯として表示される (「横にして見てもらう」前提)

### HTML 出力の構造

- 1 デッキ = 1 HTML。外部ファイル参照なしで自己完結 (spike で 72 KB、OGP メタ込み)。スライド位置は `#N` (1 始まり) か要素 id
- 各スライドは `<svg viewBox="0 0 1280 720"><foreignObject><section>…HTML…</section></foreignObject></svg>` (inline SVG モード)。**JS で測らず、viewBox に拡縮を任せる** = 固定キャンバス + 一様スケールをそのまま実装したもの
- ただし Marpit 自身が inline SVG を「WebKit の描画が変なので experimental」としており、Safari 向け polyfill (`setZoomFactor`) を出力に埋め込んでいる。Nun が iOS Safari の SVG で苦労した種類の問題を Marp 側が保守している

### SSG

- Marp の設計の中心は「ローカルで書いて、ファイル (PDF / PPTX / 画像 / 自己完結 HTML) として出す」。複数デッキをサイトとして公開するのは範囲外 (サーバーモードの一覧はローカル確認用)
- **発表機能は marp-cli の bespoke テンプレートにしか無い**。Marp Core (`render()` → `{ html, css }`) を Vite / Astro に組み込むと、ナビゲーション・発表者ビュー等は自前になる
- 型 A: marp-cli をビルド工程に使う (`marp -I benben -o dist`)。発表機能はそのまま。自前は一覧ページ、サムネイル (`--image png` → WebP)、`public/` のコピー、ビルド後 HTML への後付け (cursor-jack、キー追加、脚注 tooltip)。開発はサーバーモード + watch (全体リロード)
- 型 B: Marp Core を自前 SSG に組み込む。Vite HMR と既存の一覧 / OGP を流用できるが、発表機能は自前
- 個人の軽量ツールなら **型 A** が合う。Nun は「デッキを作るエンジン = Marp」「サイトにする層 = Nun」という分担にできる

## 5. レスポンシブと zoom-fit

### Nun の現状と問題の根

- section = `100vw × 100dvh` の可変縦横比、文字と余白は `cqmin` + `clamp()` (`theme.css:60-71`) で組み直し
- 画面の形が変わるたびにはみ出しが変わるので、実行時に測って縮める zoom-fit が必要になり、それが収束しない
- `src/client/zoom-fit.ts` の不安定要因 (コードを読んだ見立て):
  1. 幅 (`visualW / scale`) と縮小率の 2 つを動かしていて、互いに影響し合う。折り返しで高さが不連続に変わるものに対して不動点反復をしている
  2. 縦横比固定の要素 (`embed_svg` の `width:100%; height:auto`、画像) は幅を広げると高さも伸びるので、縮小率を下げるほどさらに下がる → 10 回の上限まで縮み続ける (`design-rework.md` の「テスト用の箱が消えた」も恐らくこれ)
  3. フォント読み込み前後、URL バーによる `100dvh` の変化、iOS が拡大後の値を返す、で測るたびに値がぶれる
- iOS 向けの SVG 入れ子 + 負 em の回避策 (`fbg.ts`、footer) も、画面に合わせてフッターを配置しようとした結果

### ちゃんとやるなら (調べた定石)

CSS 標準の `text-grow` / `text-shrink` / `text-fit` は Blink チームの素案 + 試作段階で、しかも横幅合わせのみ。縦のはみ出しは当面 JS + CSS の組み合わせになる。

1. **調整する値を 1 つにして二分探索する** (textFit、PowerPoint の `normAutofit fontScale / lnSpcReduction`)。幅はいじらず `--fit` だけを動かす。`theme.css` の変数に `var(--fit)` を掛ければ導入できる
2. **画像 / SVG を余った領域に合わせて伸縮する側に回す** (grid `1fr` + `min-height: 0` + `object-fit: contain`)。文字が先に高さを取る
3. **縮める前に段階的に崩す**: レイアウト切替 (container query) → 余白・行間 → `--fit` → 最後に一様縮小
4. **計測をリフローから切り離す**: [Pretext](https://github.com/chenglou/pretext) (DOM を使わず複数行テキストの高さを計算)、`document.fonts.ready` 待ち、`ResizeObserver`、非表示の複製で計測
5. **結果をビルド時に計算して保存する**: 縦横比ごとの `--fit` を Playwright で求めて静的 CSS に出す

別案として「複数の固定サイズ (16:9 / 4:3 / 1:1 / 3:4 / 9:16) を縦横比で選び、各サイズ内は一様拡縮、はみ出しはビルド時の撮影で警告」も検討した。

### Marp 上でのレスポンシブ (spike で確認)

- テーマに `/* @size landscape 1280px 720px */` と `/* @size portrait 720px 1280px */` を定義し、同じ md から `size: portrait` 付きの版も出力
- 両 HTML に `switch.js` (約 10 行、`matchMedia('(max-aspect-ratio: 1/1)')` で `location.replace`) を注入
- ブラウザで確認: 1280×720 では横長版、375×812 では縦長版に切り替わり、スライド位置 (`#3`) も引き継がれた。縦長版では文章が折り返し直される
- Nun との差: ピクセル単位で連続して組み直されるのではなく、境目で切り替わる (境目で一瞬再読み込み)。SVG は横長のまま (向きごとに作るなら desugar で出し分け)
- 「開発者ツールで幅をぐりぐり動かしても組み直される」気持ちよさは Nun にしか無いが、それこそが zoom-fit 不安定の原因でもある。「縦持ちのスマホで読める」実用面はこの方式でほぼ手に入る

## 6. AI 生成の画像 / レイアウトの扱い

既存の AI スライド / 図解ツールの対応:

1. **レイアウトの型を決め、AI は中身を埋めるだけ** (Gamma、Beautiful.ai、自作ジェネレーター多数)。AI に座標を書かせない
2. **AI 向けの宣言的な図の記法**: Mermaid、D2、[AntV Infographic](https://github.com/antvis/infographic) (インデントで階層、約 200 テンプレート、不完全な出力でも描画できる、SVG 出力)
3. **スライドごとに HTML を丸ごと書かせる** (Genspark、Manus)。今回のデッキは実質これになっていた
4. **画像は別ファイルに置き、md からは参照** (Marp / Slidev の普通のやり方)

共通点は「md には何を見せたいかだけ、配置の計算はビルド時」。Nun に当てはめた優先順位:

1. よく使う形は md 記法で (段組み `:::cols`、アイコン短縮記法 (Iconify)、ロゴ `!logo[unity]`)
2. 何度も使う独自の図は名前付き描画プラグインに (`gen-logo-map.ts` を `embed_logos scatter seed=3 reveal=…` のように。段階表示のスライドもビルド時に自動生成)
3. 汎用的な図は既存記法 (Mermaid、AntV Infographic)
4. それでも手書き SVG が要るなら外部ファイルにして参照

→ 今回の結論では、まず「SVG は外部パスへ」を採用。

## 7. なぜ前回は Nun を続けたか (再評価)

- 経緯: 2026-04-05〜06 に最初の実装 (Astro 版) を 2 日で作り、`docs/comparison.md` は作り直し (regenerate) のタイミングの 2026-04-29 に書かれた。「作りたいから作った → 作り直す前に続ける理由を言語化した」順番
- `docs/comparison.md` の理由の再評価:

| 当時の理由 | 今の評価 |
|---|---|
| heading 階層をそのまま DOM にしたい | 今回撤廃する方向 |
| テンプレートで DOM 構造ごと切り替えたい | 同上 |
| 一覧、OGP、ナビゲーションは Marp の範囲外 | 言い過ぎ。OGP 指定、キー・スワイプ、フルスクリーン、発表者ビューまで Marp にある。自前は一覧ページのみ |
| Marp は HTML がデフォルト無効 | `--html` 1 つで有効 |
| Marp のテーマは Sass 前提 | 事実と違った。CSS 変数を使った普通の CSS テーマがそのまま動いた |
| デフォルトテーマの拡張が難しい | 自前テーマを持つなら無関係 |
| コンバーター案は階層の後処理が必要で中途半端 | 階層を捨てたので行単位の desugar で済んだ |
| Marp から得られるのは実質 PDF / PPTX だけ | 過小評価。発表者ビュー、発表者メモ、一覧表示、段階表示、PDF しおりもある |

- 当時の判断は「heading 階層が核」という前提では筋が通っていた。それ以外は Marp を深く触らずに書いた部分がやや不正確だった
- 無駄ではなかった: spike が約 150 行で済んだのは、Nun を作った経験で「何が要って何が要らないか」(🌊 / nwyt の書き心地、フッターのデザイン、PDF で詰まる点、階層は実は厄介) が分かっていたから

## 8. 未決事項

- 記法 (🌊 / nwyt / `~~~meta`) をどこまで引き継ぐか。desugar はそのまま移行スクリプトにもなる (1 回通して書き戻せば Marp 記法への移行完了) ので、「まず desugar 方式 → 様子を見て書き戻す」順が低リスク。`!fbg` や画像ユーティリティ class のように desugar で作り直すと重いものは削る候補
- リポジトリをどうするか (このリポジトリで Marp 構成に置き換えるか、別リポジトリか)
- 残りの判断材料: cool-game デッキ全体と fonts.md の compare スライドを spike に通す (compare は `## ` 区間を `<article>` で囲む desugar で一段の入れ子を作れる見込み、未検証)
