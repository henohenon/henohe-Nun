# henohe-Nun

スライドプレゼンテーションツール。Markdown → HTML slides。

## リファクタ

`design.md` に新しい設計方針がある。コード変更時は必ず参照すること。

主な変更点:
- Astro廃止 → Vite + 自前パーサー + UnoCSS
- `@tag` 系の独自記法を全廃、5種類の記法に統一（`.class` `$var` `~key` テンプレート宣言 frontmatter）
- テンプレートは `.astro` コンポーネントではなくHTML文字列を返すTS関数
- テーマはCSSのみ担当

## スライドの仕組み

- `benben/` 配下のMarkdownがデッキ定義
- `#` でスライド分割、`##` でsection分割
- CSS Container Query Units (`cqw`/`cqh`/`cqmin`) でサイズ非依存レンダリング

## ツール・コマンド

- Biome: lint/format (`bun run lint`)
- 型チェック: `bun run typecheck`
- Bun: dev/build
- tsx (Node): export scripts — Bunではなく Node で実行（Playwright互換性のため）

## export scripts (scripts/)

- `_lib.ts`: 共通処理（ビルド、httpサーバー、Chromium CDP接続、デッキ列挙）
- `pdf.ts`: multi-page PDF via `@media print` + Ghostscript
- `png.ts`: per-slide screenshots（ページフィルタ: `build:png sample 0 3`）
- `webp.ts`: OGP thumbnail (sharp)
- `SKIP_BUILD=1` でビルドスキップ
