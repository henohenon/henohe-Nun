# henohe-Nun 設計方針アップデート

## 基本方針

**MDの拡張をやめる。**

独自タグで表現力を追求するとCSSの劣化版になる。
MDの認知モデル（フラット・局所的）を壊さないことを最上位の制約とする。
複雑なレイアウトが必要な時はHTMLを書く、と宣言する。

---

## 記法

5種類に統一する。

```
.class             スコープへのclass指定（テーマ指定も兼ねる）
$var: value        CSS変数の上書き
value~key          値を別レイヤーに送る
🌊template        テンプレート宣言
```

### スコープ

見出し階層がそのままスコープになる。直後の行が `.` または `$` で始まればclass/var宣言。
ルート（最初の `#` より前）にも指定でき、デッキ全体に適用される。

```
.deck-wide
$brand: #ff0000

# スライド
.dark.p-8
$accent: #ff0000

## セクション
.flex-1
内容
```

`#` がスライド、`##` 以下がその中のarticleとして区切られる。インライン以下の粒度はHTMLを書く。

### `~` 記法

後置修飾子。値を別レイヤーに送る。`.` でオプションをチェーン。
オプションはUnoCSS語彙に乗っかる。UnoCSSにないものは独自classで拡張する。

```
テキスト~fr
テキスト~fl
![](/path.png)~bg
![](/path.png)~fbg.grayscale.blur-sm.opacity-30
[alt](url)~card
[alt](url)~card.horiz
```

### テンプレート

`🌊` はNun（エジプトの原初の水の神）から。スニペットで `nun` → `🌊` に展開する運用。

```
# タイトル
🌊hero

# 自己紹介
🌊me
```

テンプレートは `##` スコープとclassの組み合わせの名前付きショートカット。
テーマが `.hero` `.me-left` 等を解釈する。

### frontmatter

デッキ全体のメタ情報はfrontmatterに書く。

```
---
date: 2026/04/10
---
```

---

## 既存タグ

全削除。

```
@date> @fr> @fl> @bg> @fbg>
@theme> @var> @class>
@>template @icon>
@gap> @align>
@link> @img>
```

---

## アーキテクチャ

Astroを廃止し、Vite + 自前パーサーに移行する。

### Astro廃止の理由

Astroは「コンポーネントが構造を知っている」という設計思想を持つ。
テンプレートごとに `.astro` ファイルが構造を静的に定義し、スロットの数も固定される。

新しい設計では「パーサーが構造を動的に組み立て、classで柔軟に拡張する」という逆向きの思想になった。
パーサーが出力したツリーをAstroのコンポーネント構造にマッピングする変換レイヤーが複雑化し、
設計の一貫性を保てなくなった。

Astroが実質的に担っていたのはViteのラッパーとルーティングのみで、
コンポーネントシステムという中核機能がむしろ邪魔になっていた。

### 新構成

```
Vite        HMR・dev server・バンドル
marked      MDパース（既存）
sharp       画像最適化
UnoCSS      CSS（Viteプラグイン）
Playwright  PDF/PNG出力（既存）
```

パーサーがHTML文字列を直接生成する。テーマはCSSのみ担当する。
トップページの一覧生成はViteのビルドスクリプトで対応する。


---

## パーサー設計

### 処理フロー

```
md
→ Stage1: frontmatter抽出 + # でスライド分割、ルートの .class $var を抽出
→ Stage2: 各スライドから .class $var 🌊template を抽出、## でarticleに分割
→ Stage3: ~ 展開（fr/fl/bg/fbg等をバッファに積む）、本文をmarkedに流す
→ Stage4: テンプレート関数でHTML文字列を組み立て
```

### テンプレート

テンプレートはHTML文字列を返すTS関数として定義する。
`🌊` で指定されたテンプレート名に対応する関数が呼ばれる。指定なしは `default`。

```ts
const templates = {
  default: (slide) => `
    <section class="slide">
      ${bgLayer(slide)}
      <article class="slide-content template-default">
        <h1>${slide.heading}</h1>
        <div class="body">
          ${slide.articles.map(a => `
            <article>
              <h2>${a.heading}</h2>
              <div class="body">${a.body}</div>
            </article>
          `).join('')}
        </div>
      </article>
      ${footer(slide)}
    </section>
  `,
}
```

`bgLayer()` `footer()` 等の共通パーツは関数として切り出す。
テーマ独自のテンプレートを追加する場合も関数を足すだけ。

### スコープとclass/var指定

テーマ指定（`.dark` 等）は `#` スライドスコープのみに限定する。
`##` のarticleスコープには `.class` と `$var` のみ指定できる。

```
ルート        .class $var   → デッキ全体に適用
#             .class $var   → スライド全体に適用（テーマ指定もここ）
##            .class $var   → article単位に適用
```