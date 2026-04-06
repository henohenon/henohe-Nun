# へのへ Nun

Markdown でスライドを書いて HTML / PDF / PNG で出力する、俺俺プレゼンツール。
Astro ベースの SSG で、`benben/` 以下の `.md` ファイルがそれぞれ 1 デッキになる。

**デモ**: https://henohenon.github.io/henohe-Nun/

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
- `SKIP_BUILD=1` で astro build をスキップ (dist/ が既にある場合)

## デッキの書き方

`benben/` にファイルを置く。`benben/my-talk.md` → `/my-talk` でアクセスできる。

### 基本構造

```md
@date>2025/02/07
@fr>フッター右
@fl>フッター左
@f-bg opacity=0.5 blur=10>./images/bg.png

# スライドタイトル
@>title
## サブタイトル

# ふつうのスライド
- markdown が使える
- **太字**、*斜体*、`code`、コードブロック

# 自己紹介
本文がここに入る
@>me
@icon>./images/icon.png
@bg opacity=0.5>./images/bg.png

#
@>thx
```

### プリアンブル（先頭 `#` より前）

デッキ全体に適用されるメタ情報。

| タグ | 説明 |
|-----|------|
| `@date>YYYY/MM/DD` | 日付。title テンプレのフッター右に自動表示 |
| `@fr>テキスト` | フッター右（全スライド共通） |
| `@fl>テキスト` | フッター左（全スライド共通） |
| `@bg [attrs]>パス` | 背景画像（全スライド共通） |
| `@f-bg [attrs]>パス` | フッター背景/マスク画像（全スライド共通） |

フッターテキストには markdown インライン記法が使える: `@fl>すら~~いど~~**てんぷれーと**`

### スライド区切りとメタタグ

`# 見出し` でスライドが区切られる。各スライド内で使えるタグ:

| タグ | 説明 |
|-----|------|
| `@>template` | テンプレート指定 (省略で `default`) |
| `## サブ見出し` | サブタイトル（title, note で使用） |
| `@icon>パス` | アイコン画像 (me 用) |
| `@bg [attrs]>パス` | 背景画像（そのスライドだけ） |
| `@f-bg [attrs]>パス` | フッター背景（そのスライドだけ） |
| `@fr>テキスト` | フッター右（そのスライドだけ上書き） |
| `@fl>テキスト` | フッター左（そのスライドだけ上書き） |

### テンプレート

| 名前 | 用途 | 使うもの |
|------|------|---------|
| `title` | タイトルスライド | `# 見出し`, `## サブ`, 日付→フッター右 |
| `me` | 自己紹介 | `# ラベル`, `@icon`, 本文 |
| `default` | 汎用（省略時） | `# 見出し`, 本文 |
| `big` | でかい一言 | `# テキスト` のみ |
| `note` | 注釈/特殊 | `# 見出し`, `## サブ`, 本文 |
| `thx` | 締め | 固定表示、何も要らない |

### レイアウトノード

本文中にインラインで配置やスタイルを制御するタグが使える。

```md
# レイアウト例
<row fit>
    <col>
        <b left>ラベル</>
        [./images/photo.png]
    </col>
    <col>
        ここにテキスト
    </col>
</row>
```

| タグ | 説明 |
|-----|------|
| `<row [attrs]>...</row>` | 横並び（flex row） |
| `<col [attrs]>...</col>` | 縦並び（flex column） |
| `<attrs>...</>` | インラインブロック（短縮形） |

**画像埋め込み**: `[./images/foo.png]` と書くだけ（`![]()` は不要）。

### 属性リファレンス

レイアウトノード、`@bg`、`@f-bg` 等に付与できる。数値は px 基準 (1920x1080)。

**サイズ・位置**
| 属性 | CSS |
|-----|-----|
| `w`, `h` | width / height |
| `x`, `y` | left / top (絶対配置) |
| `m`, `mt`, `mb`, `ml`, `mr` | margin |
| `p`, `pt`, `pb`, `pl`, `pr` | padding |

**テキスト**
| 属性 | 効果 |
|-----|------|
| `s=48` | font-size (px) |
| `color=red` | 文字色 |
| `b` | 太字 + テーマカラー |
| `i` | 斜体 |

**配置**
| 属性 | 効果 |
|-----|------|
| `left`, `right`, `center` | 水平配置 |
| `top`, `bottom`, `vcenter` | 垂直配置 |
| `fit` / `hfit` / `vfit` | コンテナにフィット |

**画像 (`@bg`, `@f-bg`)**
| 属性 | 効果 |
|-----|------|
| `opacity=0.5` | 透明度 |
| `blur=10` | ぼかし |
| `x=5%` | 位置オフセット |

## アセット

画像パスは `./images/...` の相対パスで書く。ビルド時に Astro の画像最適化パイプライン (sharp) を通り、WebP に変換される。
画像ファイルの実体は `src/assets/images/` に置く。

## ナビゲーション

- `←` / `→` キー、`Space` (次へ) で移動
- 画面左右クリック / タッチスワイプで前後移動
- フルスクリーンヒント表示あり（4秒で消える）

## 構成

```
benben/              デッキ (.md)
src/
  assets/images/     画像アセット
  lib/               パーサー, 画像解決
  components/
    templates/       Title, Me, Default, Big, Thx, Note
    layers/          BgLayer, FooterLayer, NodeRenderer
  pages/             Astro ルーティング
  styles/            共通 CSS, テーマ
scripts/             PDF/PNG/WebP エクスポート (tsx/Node)
public/              静的ファイル (favicon 等)
```

## 技術スタック

- **Astro 4** — SSG, dev server, HMR
- **marked** + **highlight.js** — Markdown / コードハイライト
- **CSS Container Queries** (`cqw`/`cqh`/`cqmin`) — 任意サイズでスライド描画
- **Playwright** — PDF/PNG/WebP エクスポート
- **Bun** — パッケージマネージャ / dev・build ランタイム
- **tsx (Node)** — エクスポートスクリプト実行 (Bun の Playwright 互換問題回避)
- **Biome** — lint / formatter
