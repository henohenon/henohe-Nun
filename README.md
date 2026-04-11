# へのへ Nun

Markdown でスライドを書いて HTML / PDF / PNG で出力する、俺俺プレゼンツール。
Astro ベースの SSG で、`benben/` 以下の `.md` ファイルがそれぞれ 1 デッキになる。

名前はうめき声とエジプトの神様から

![img.png](img.png)

## セットアップ

```sh
bun install
bunx playwright install chromium   # PDF/PNG/WebP 出力に必要
```

PDF 圧縮には [Ghostscript](https://www.ghostscript.com/) が別途必要。

## コマンド

| コマンド | 説明 |
|---------|------|
| `bun run dev` | 開発サーバー (HMR) |
| `bun run build` | SSG ビルド → `dist/` |
| `bun run build:pdf [deck]` | PDF 出力 → `dist/.pdf/` |
| `bun run build:png [deck] [pages...]` | スライド PNG 出力 → `dist/.png/` |
| `bun run build:webp [deck]` | OGP 用 WebP (1200x630) → `dist/.webp/` |
| `bun run build:thumbs` | サムネイル生成 → `public/thumbs/` |
| `bun run lint` | Biome lint/format チェック |
| `bun run lint:fix` | 自動修正 |
| `bun run typecheck` | Astro + scripts 型チェック |

- `--scale=2` で PNG/PDF を Retina 品質 (3840x2160) に
- `SKIP_BUILD=1` で astro build をスキップ (`dist/` が既にある場合)

## デッキの書き方

`benben/` にファイルを置く。`benben/my-talk.md` → `/my-talk` でアクセスできる。サブディレクトリも使える: `benben/private/foo.md` → `/private/foo`。

### 基本構造

```md
@date>2026/04/10
@fr>フッター右
@fl>フッター左
@fbg o=0.3 blur=10>/bg.png

# タイトルスライド
@>title
## サブタイトル

# ふつうのスライド
- markdown が使える
- **太字**、*斜体*、`code`、コードブロック

# 自己紹介
@>me
@icon round=50%>/icon.png
本文がここに入る

#
@>small
```

### プリアンブル（先頭 `#` より前）

デッキ全体に適用されるメタ情報。

| タグ | 説明 |
|-----|------|
| `@date>YYYY/MM/DD` | 日付。title テンプレのフッター右に自動表示 |
| `@fr>テキスト` | フッター右（全スライド共通） |
| `@fl>テキスト` | フッター左（全スライド共通） |
| `@bg [attrs]>パス` | 背景画像（全スライド共通） |
| `@fbg [attrs]>パス` | フッター背景/マスク画像（全スライド共通） |
| `@theme>name` | デッキ全体のテーマ（`data-theme` 属性） |
| `@var name>値` | CSS カスタムプロパティ (`--name`) |

フッターテキストには markdown インライン記法が使える: `@fl>すら~~いど~~**てんぷれーと**`

### スライド区切りとメタタグ

`# 見出し` でスライドが区切られる。各スライド内で使えるタグ:

| タグ | 説明 |
|-----|------|
| `@>template` | テンプレート指定 (省略で `default`) |
| `## サブ見出し` | サブタイトル（title / note / row で使用） |
| `@icon [attrs]>パス` | アイコン画像 (me テンプレ用) |
| `@bg [attrs]>パス` | 背景画像（そのスライドだけ） |
| `@fbg [attrs]>パス` | フッター背景（そのスライドだけ） |
| `@fr>テキスト` | フッター右（そのスライドだけ上書き） |
| `@fl>テキスト` | フッター左（そのスライドだけ上書き） |
| `@theme>name` | テーマをそのスライドだけ上書き |
| `@var name>値` | CSS 変数をそのスライドだけ上書き |

### テンプレート

| 名前 | 用途 | 使うもの |
|------|------|---------|
| `title` | タイトルスライド | `# 見出し`, `## サブ`, `@date` → フッター右 |
| `me` | 自己紹介 | `# ラベル`, `@icon`, 本文 |
| `default` | 汎用（省略時） | `# 見出し`, 本文 |
| `big` | でかい一言 | `# テキスト` のみ |
| `note` | 中央本文 + 補足 | `# 見出し`, `## 補足`, 本文 |
| `row` | 横並びブロック | `## ` でブロックを分割 |
| `small` | 締め・小文字 | 固定表示 |

### `@>row` テンプレート

`## ` ごとに横並びブロックを作る。H3 ではなく H2 がブロック境界になるのがポイント。

```md
# 比較
@>row
@gap>3em
@align>center

## Pros
- Clean syntax
- No HTML needed

## Cons
- Only horizontal
- No nested rows
```

- `@gap>` — ブロック間の間隔（CSS の `gap` そのまま）
- `@align>` — 水平配置 (`left` / `center` / `right` / 生 `justify-content` 値)
- 最初の `##` より前に本文があれば、タイトルなしの先頭ブロックになる
- 幅は中身に応じた auto-fit (`grid-auto-columns: minmax(0, auto)`)

### 画像埋め込み

**ブラケット省略記法**: `[./foo.png]` → `<img>`、`[https://...]` → 自動リンク。

```md
[/henohe-Nun.png]
[https://example.com]
```

**`@img` ディレクティブ**: 背景画像として `<div>` を生成する。属性で見た目を制御できる。

```md
@img cover>/photo.png
@img mono blur=3 o=0.5>/photo.png
```

画像の解決順:
1. `/src/assets/images/<path>` にマッチすれば astro の画像最適化 (sharp → WebP) を通す
2. 見つからなければ生パスをそのまま返す（`public/` 配下や外部 URL）

### `@link` ディレクティブ（OGP カード）

URL を OGP カードとして埋め込む。ビルド時に fetch される。

```md
@link>https://github.com/henohenon/henohe-Nun
@link v>https://github.com/henohenon/henohe-Nun
```

- `v` を付けると縦型レイアウト

### コードブロック拡張

fenced code の言語指定は `[diff_]<lang>[:filename][#L<start>]` 形式。

| 書き方 | 効果 |
|--------|------|
| ` ```js ` | 通常のシンタックスハイライト |
| ` ```diff_js ` | `+` / `-` 行に背景色を付けつつ、残りの行はハイライト |
| ` ```js:sample.js ` | ヘッダーに `sample.js` を表示 |
| ` ```ts#L10 ` | 10 から始まる行番号を付ける |
| ` ```diff_ts:utils.ts#L9 ` | 全部乗せ |

Copy ボタンはハイライト済み HTML ではなく生ソース (`data-source`) をコピーする。

### 自由レイアウト

本文中では生 HTML + **UnoCSS** のユーティリティクラスが使える。markdown は空行で区切れば HTML ブロック内でもパースされる。

```md
<div class="grid grid-flow-col gap-2">
<div>

テーブル A
| a | b |
|---|---|

</div>
<div>

テーブル B
| c | d |
|---|---|

</div>
</div>
```

### 画像属性リファレンス

`@bg` / `@fbg` / `@icon` / `@img` に付与できる。数値は px 基準 (1920x1080)。

**サイズ・配置**
| 属性 | 効果 |
|-----|------|
| `w=N`, `h=N` | `background-size` |
| `cover` | `background-size: cover` (デフォルトは `contain`) |
| `x=N`, `y=N` | 位置オフセット |
| `top`, `bottom`, `left`, `right`, `center` | 配置キーワード |
| `round=N` | `border-radius` |

**トランスフォーム**
| 属性 | 効果 |
|-----|------|
| `rot=Ndeg` | `rotate` |
| `flip` | 水平反転 |
| `o=0.5` | `opacity` |

**フィルタ**
| 属性 | 効果 |
|-----|------|
| `mono` | グレースケール |
| `bin` | 2 値化（grayscale + 超高 contrast） |
| `sepia` | セピア |
| `invert` | 色反転 |
| `blur=N` | ぼかし |
| `bright=N` | 明るさ |
| `contrast=N` | コントラスト |
| `saturate=N` | 彩度 |
| `hue=Ndeg` | 色相回転 |
| `shadow=N` | `drop-shadow` (`var(--shadow)` を使用) |
| `c=Ndeg` | カラー着色 (grayscale + sepia + hue-rotate) |

## アセット

- **最適化したい**: `src/assets/images/` に置いて `/foo.png` のように書く。sharp で WebP 化される。
- **そのまま置きたい**: `public/` に置いて同様に `/foo.png` で参照。

## ナビゲーション

- `←` / `→` / `Space` / `PageDown` / `w` / `a` / `s` / `d` キーで移動
- `Home` / `End` で最初／最後へ
- `Enter` でフルスクリーントグル
- 画面左右クリック（フルスクリーン時）・タッチスワイプ・マウスホイールで前後移動
- `.slide-body` の内容が溢れたら `zoom` で自動縮小される

## 構成

```
benben/              デッキ (.md)
src/
  assets/images/     画像アセット（最適化対象）
  lib/
    parser.ts        3 段階パーサー (deck / frame / body)
    markdown.ts      marked + hljs, code fence 拡張
    markup.ts        @img / @link / [bracket] 展開
    style.ts         画像属性 → CSS
    ogp.ts           OGP fetch
  components/
    templates/       Title / Me / Default / Big / Small / Note / Row
    slide/           Slide, BgLayer, FooterLayer, Markup
    head/            HeadMeta, Favicon
  pages/             Astro ルーティング ([deck].astro, index.astro)
  styles/            theme.css, slide-common.css, deck.css
scripts/             PDF/PNG/WebP エクスポート (tsx/Node)
public/              静的ファイル (favicon, 非最適化画像等)
```

パーサーは 3 段構成:

1. **Stage 1** `parseDeck(md)` — プリアンブルのグローバルメタ抽出 + H1 でスライド分割
2. **Stage 2** `parseFrame(source)` — スライド共通メタ (`@bg` / `@fr` / `@icon`…) を取り出し、残りを `bodyLines` に
3. **Stage 3** `parseTitle` / `parseBody` / `parseNote` / `parseRow` — テンプレート固有の本文解釈

Slide.astro がテンプレート名でディスパッチし、Stage 2/3 を呼ぶ。

## 技術スタック

- **Astro 4** — SSG / dev server / HMR
- **marked** + **highlight.js** — Markdown / シンタックスハイライト
- **UnoCSS** (`presetWind4`) — スライド本文で使えるユーティリティクラス
- **CSS Container Queries** (`cqw`/`cqh`/`cqmin`) — 任意サイズでスライド描画（サムネ流用のため）
- **Playwright** — PDF/PNG/WebP エクスポート
- **sharp** — 画像最適化 / OGP 生成
- **Bun** — パッケージマネージャ / dev・build ランタイム
- **tsx (Node)** — エクスポートスクリプト実行（Bun の Playwright 互換問題回避）
- **Biome** — lint / formatter
