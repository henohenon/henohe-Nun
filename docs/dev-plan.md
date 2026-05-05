# 実装計画

## フェーズ

- [x] 0. 仕様策定
- [x] 1. プロジェクト初期化 — bun, package.json, tsconfig, vite.config, UnoCSS
- [x] 2. パイプライン骨格 — unified + remarkParse + remarkRehype + rehypeStringify
- [x] 3. Scope 構造化 + default テンプレート — h1/h2 分割、default テンプレート描画
- [x] 4. Vite plugin (dev) — middleware + transformIndexHtml
- [x] 5. micromark extensions — template, nwyt prop, nwyt content, admonition (remark plugin)
- [x] 6. 既存 remark/rehype plugins 統合 — gfm, math, breaks, katex (mark 保留, shiki Phase 8)
- [x] 7. 残りのテンプレート — title, me, message, solo (Phase 3 で実装済み)
- [x] 8. コードブロック拡張 — diff, embed, header, 行番号, shiki
- [x] 9. フッター + 背景 — fl/fr, bg (fbg マスク未実装)
- [x] 10. 脚注 — 収集 → Scope 紐付け → render → 参照解決
- [x] 11. クライアント JS — navigation, zoom-fit, tooltip, copy
- [x] 12. ビルド (resolveId/load) — Vite HTML エントリ方式
- [x] 13. PDF/WebP 出力 — Playwright + sharp + mutool optional (`docs/spec/export.md`)
- [ ] 14. デザイン・CSS リワーク — 見た目とレイアウトの課題整理 (`docs/design-rework.md`)
