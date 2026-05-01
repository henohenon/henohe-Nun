# 実装計画

## フェーズ

- [x] 0. 仕様策定
- [ ] 1. プロジェクト初期化 — bun, package.json, tsconfig, vite.config, UnoCSS
- [ ] 2. パイプライン骨格 — unified + remarkParse + remarkRehype + rehypeStringify
- [ ] 3. Scope 構造化 + default テンプレート — h1/h2 分割、default テンプレート描画
- [ ] 4. Vite plugin (dev) — middleware + transformIndexHtml
- [ ] 5. micromark extensions — template, nwyt prop, nwyt content, admonition
- [ ] 6. 既存 remark/rehype plugins 統合 — gfm, math, breaks, mark, katex, shiki
- [ ] 7. 残りのテンプレート — title, me, message, solo
- [ ] 8. コードブロック拡張 — diff, embed, header, 行番号
- [ ] 9. フッター + 背景 — fl/fr, bg/fbg
- [ ] 10. 脚注 — 収集 → Scope 紐付け → render → 参照解決
- [ ] 11. クライアント JS — navigation, zoom-fit, tooltip, copy
- [ ] 12. ビルド (resolveId/load) — Vite HTML エントリ方式
- [ ] 13. PDF/WebP 出力 — Playwright + mutool
