# 競合比較・技術選定メモ

## 競合ツール比較

| ツール | スライド区切り | ネスト | Web ファースト | カスタム記法 | 出力 |
|---|---|---|---|---|---|
| **Marp** | `---` | なし（フラット） | △（PDF寄り） | markdown-it plugin | HTML/PDF/PPTX/画像 |
| **Slidev** | `---` | なし | ○（Vue ベース） | Vue コンポーネント | HTML/PDF |
| **reveal.js** | `<section>` ネスト | 2階層（横+縦） | ○ | markdown + plugin | HTML/PDF |
| **Nun** | heading 階層 | 無制限（h1〜h6） | ○ | micromark extension | HTML/PDF/WebP |

## Marp との比較

### Marp でカバーできる部分
- Markdown → スライド変換（CommonMark ベース）
- テーマ / カスタム CSS（directive + テーマ CSS）
- 背景画像（`![bg](url)` — Nun の `!bg~[alt](url)` と類似）
- KaTeX 数式
- 自動スケーリング
- HTML / PDF / PPTX 出力
- VS Code 拡張でのライブプレビュー
- `marp-cli --watch` でホットリロード（WebSocket フルリロード）

### Marp の plugin で足せる部分
- `:::note` admonition → markdown-it-container
- `==highlight==` → markdown-it-mark
- `embed_mermaid` → markdown-it plugin
- `!card` リンクカード → plugin + ビルド時 OGP fetch
- コードブロック拡張 → markdown-it fence カスタマイズ

### Marp では実現困難な部分
- **heading 階層 = DOM 階層**: Marp は 1 ページ = フラットな `<section>` 固定。h1/h2/h3 が section/article のネストになる構造は Marpit のスライド分割モデル自体が異なる
- **テンプレートで DOM 構造ごと切り替え**: `--html` + CSS で近いことは可能だが、`<div>` を手書きする必要がある。Nun の「🌊me と書くだけ」の簡潔さは得られない
- **Web サイトとしてのデプロイ**: 一覧ページ、OGP、クライアントナビゲーション（キーボード/タッチ/フルスクリーン）は Marp の範囲外

### Marp の既知の痛み
- HTML がデフォルト無効（`<b>` すら効かない、カスタム CSS クラスも無視される）
- テーマカスタマイズが Sass 前提（CSS 変数でサクッと変えられない）
- デフォルトテーマの拡張が困難（少し色を変えたいだけでもテーマ丸ごと書き直し）
- DOM 構造が固定（CSS でしかレイアウトを変えられない）

### Marp コンバーターアプローチの検討
「Nun 記法 → Marp 互換 Markdown」のプリプロセッサを書く案も検討した。

結論: 中途半端になる。
- heading 階層の変換は Marp 出力後にポストプロセッサも必要
- Marpit の内部構造に依存し、Marp のアプデで壊れうる
- 変換層が Marp の制約に引きずられて複雑化
- Web 部分（ナビ・zoom-fit・一覧・OGP）は結局自前
- Marp から得られるのは実質 PDF/PPTX 出力だけで、Playwright で代替可能
- unified で直接やれば 1 本のパイプラインで済む

## reveal.js との比較

最も近い競合。横スライド + 縦スライドの 2 階層ネストを持ち、Web ファーストでブラウザプレゼンが一級市民。

### Nun との違い
- ネスト深度: reveal.js は 2 階層まで、Nun は heading レベル分
- 構造の意味: reveal.js は横=メイン/縦=オプション、Nun は heading 階層がそのまま DOM 階層
- テンプレート: reveal.js にはない（CSS/JS で自力）
- 記法: reveal.js は HTML or Markdown + `---`、Nun は Markdown only
- ビルド: reveal.js はランタイム変換、Nun は SSG

### heading ベースのトレードオフ
Marp/Slidev/reveal.js は `---` 区切りなので h1 が連続するスライドが自然に書ける。Nun は h1 = ページ区切りなので同レベルの heading を並べるのが構造的に窮屈。`# `（空白 h1）による見出しなしページはこの制約への対処。

heading に「ページ区切り」と「DOM 階層定義」の 2 つの役割を背負わせているのが Nun の特徴であり制約。分離すると Marp に近づき、一体のままだと h1 連打がしづらい。

## 技術選定

### 採用スタック

```
Vite（ビルド + HMR）
├── unified（remark → rehype → Scope → hast → stringify）
│   ├── micromark extensions     (🌊 template, !key nwyt)
│   ├── micromark admonition ext  (::: admonition, 自前実装)
│   ├── remark-math              ($...$ / $$...$$)
│   ├── rehype-katex             (数式レンダリング)
│   ├── rehype-shiki             (コードハイライト + diff)
│   └── custom rehype plugins    (embed SSR, code block拡張, 脚注)
├── Scope 構造化 + テンプレート適用（hastscript h()）
├── UnoCSS + CSS 変数（@apply 活用）
├── vanilla TS（クライアント: navigation, zoom-fit）
└── Playwright（PDF / WebP 出力）
```

### 選定理由

**Vite（Astro ではなく）**
- Astro の Content Collections は標準的な Markdown ブログ向け。Nun の独自記法は Astro のパイプラインと噛み合わず、カスタムで上書きすることになる
- SSG の実体は「md 読んで HTML 吐く」だけ。Vite plugin 1 つで済む
- HMR は Vite 標準

**unified（marked ではなく）**
- `:::` → remark-directive、`$...$` → remark-math など既存 plugin が使える
- h1 → section / h2+ → article の構造変換が rehype AST で型安全に書ける
- パース → 変換 → 出力が 1 本のパイプラインで完結

**micromark extension（remark plugin の後処理ではなく）**
- `!fn[1]` が remark のパースでリンク参照と誤認される、`~` が strikethrough と衝突する等、標準 Markdown パース後だと独自記法の抽出が壊れる
- micromark（トークナイザ）レベルで認識することで、コードフェンス内の誤マッチやエスケープを構造的に防止
- remark-directive（`:::`）や remark-math（`$...$`）も同じアプローチ

**hastscript h()（JSX ではなく）**
- unified パイプライン内の rehype plugin と同じ記法で一貫性を保つ
- テンプレートは「Scope を受け取って hast を返す関数」であり、ロジック（条件分岐、クラス付与）が自然に書ける
- JSX は HTML を書くための構文糖。Nun のテンプレートは DOM 構造の定義であり、hast が直接的な表現
- JSX（@jsxImportSource hastscript）への移行は機械的に可能でロックインなし

**rehype stringify + h()（Hono JSX ではなく）**
- パイプラインが unified で閉じる。別途テンプレートエンジンが不要
- ページシェルも hastscript `h()` で構築し、スライド本体と同じ hast ツリーとして一括 stringify

**Scope 中間構造（hast in-place 変換ではなく）**
- heading スコープという概念を明示的なデータ構造として持つ
- テンプレート適用が再帰関数として自然に書ける
- hast のフラットなノード列を直接操作するより見通しが良い

**embed SSR（CSR ではなく）**
- PDF/WebP 出力時にブラウザ側の JS 実行に依存しない
- SSG として自己完結する
- mermaid は SVG を吐くので hast に変換してそのまま埋め込める

**UnoCSS（Tailwind ではなく）**
- プリセットのカスタマイズが柔軟
- `@apply` で CSS ファイル内にユーティリティクラスを取り込む運用
- Markdown 側からのユーティリティクラス直指定は非推奨だが一応可能
- Vite 統合がこなれている

**vanilla TS（フレームワークなし）**
- ナビゲーション、zoom-fit、フルスクリーンだけなのでフレームワーク不要
