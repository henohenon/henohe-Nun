# deck 用 SVG 生成スクリプト

`benben/cool-game-development-using-web-technologies.md` で使う SVG のたたき台を作るためのもの。
SVG は `benben/images/cool-game/` に置き、md からは `<object data="images/cool-game/<名前>.svg">` で参照する。

デッキで使っている `logo-map-*.svg` / `lib-row.svg` は、生成後に手で配置を調整してある。
再実行すると調整が消えるので、出力先はスクラッチの場所にして差分を見ながら取り込むこと。

リポジトリルートから実行すること (`benben/images/engines/` を相対パスで読む)。
SVG 内の画像は `../engines/` で参照するので、出力 SVG は `benben/images/<deck>/` に置く前提。

## gen-logo-map.ts — ロゴごった煮ページ

```bash
tsx scripts/deck/gen-logo-map.ts <出力パス> [seed]
```

- `items` にロゴ (ファイル / URL / 基準幅 / アスペクト比) を定義
- seed 固定の乱数 + 当たり判定でパッキング。入らなければ全体を縮めて再試行
- `STAGES` の順に段階的に reveal した `<出力パス>-1.svg` 〜 `-N.svg` と、全部入りの `<出力パス>` を書き出す
- 配置は全体で 1 回だけ計算するので、各段でロゴの位置は動かない

## gen-lib-row.ts — 「今回は」ページ

```bash
tsx scripts/deck/gen-lib-row.ts <出力パス>
```

Three.js / PixiJS を上段、Babylon.js / Tone.js / Matter.js を下段に整列させる。

## ロゴ素材

`benben/images/engines/`。名前入りロゴ (ワードマーク) を優先し、無いものは simple-icons の
アイコン (`t: 'si'`) か、デッキのフォントで組んだ文字 (`t: 'text'`) で代用している。
