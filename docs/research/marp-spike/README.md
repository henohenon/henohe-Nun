# Marp spike — Nun 記法を Marp 上で動かす試作 (2026-09-29)

議論の経緯と結論は `docs/journal-2026-09-29-marp.md` を参照。

## ファイル

| ファイル | 内容 |
|---|---|
| `engine.mjs` | Marp CLI の functional engine。`!fl`/`!fr` の custom directive、`:::note`、`==mark==`、コードフェンス拡張 (`lang:name` / `diff_` / `embed_html` / `embed_svg`)、`!card`、`!fn`、Nun 行記法の desugar (`🌊` / `!key~` / `~~~meta`) |
| `nun.css` | Marp テーマ (`@theme nun`)。footer 線 + fl/fr、title / solo / message テンプレート、`@size landscape` / `@size portrait` |
| `deck-nun.md` | Nun 記法のままのサンプル (desugar 経由で変換) |
| `deck-marp.md` | 同じ内容を Marp 記法で書いたもの (比較用) |
| `switch.js` | 縦横比で landscape 版 / portrait 版を切り替えるスクリプト (hash でスライド位置を引き継ぐ) |
| `ogp-cache.json` | `!card` 用 OGP キャッシュ (事前取得を想定した形) |

## 実行

このディレクトリで:

```bash
bun install
npx marp deck-nun.md --engine ./engine.mjs --theme-set nun.css --html --allow-local-files
npx marp deck-nun.md --engine ./engine.mjs --theme-set nun.css --html --allow-local-files --pdf --pdf-outlines
npx marp deck-nun.md --engine ./engine.mjs --theme-set nun.css --html --allow-local-files --images png
```

- 入力ファイルは `--theme-set` より前に置く (`--theme-set` は可変長引数で md まで飲み込み、stdin 待ちで固まる)。
- 複数ファイル入力時は `-o` を使えない。1 ファイルずつ変換するか `-I <dir> -o <dir>` を使う。

### portrait 版 + 切り替え

1. `deck-nun.md` の `~~~meta` に `size: portrait` を足したコピー (`deck-portrait.md`) を作る
2. それぞれ `-o site/deck-nun.html` / `-o site/deck-portrait.html` で出力
3. 両 HTML の `</body>` 直前に `switch.js` を `<script>` で注入
4. `site/` を静的配信して、ビューポート幅を変えると `max-aspect-ratio: 1/1` を境に切り替わる

## 未実装 (spike の範囲外)

`!fbg`、画像ユーティリティ class (`!.class[](url)`)、行番号表示 (`#n` はパースのみ)、`diff_` の見た目、`embed_mermaid` / `embed_math`、脚注 tooltip (現状 `title` 属性)、`!sub` / `!lead` / `!icon` 以外の nwyt、キーバインド追加、一覧ページ、自動縮小。
