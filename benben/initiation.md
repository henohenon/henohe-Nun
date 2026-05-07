~~~meta
title: Initiation
description: Nun の全記法デモスライド
date: 2026-05-07
~~~

!fr~2026/05/07
!fbg~[fbg](/images/henohe-Nun.png)

# Initiation
🌊title
!sub~へのへNun's all demo
!bg~[bg](/images/henohe-Nun.png)


# Index
!fl~index
- About
- CustomSyntax
- Templates
  - Default
  - Title
  - Me
  - Message
  - Solo
- Markdown
- Code blocks
- Decoration blocks
- Math
- Card
- nwyt props
- Footnotes

# へのへ Nun
🌊me
!fl~about
!icon~[icon](/images/henohe-Nun.webp)

[へのへのん](https://github.com/henohenon)'s md2Slide tool
- DOM that mirrors Markdown semantics
- Responsive Rendering

# Custom Syntax
🌊solo

# Scope
heading から次の同レベル以上 heading までが 1 scope。
最初の heading より上はグローバル default。

````md
---
↑ global scope ↓
---
#
↑ scope01 ↓
---
##
↑ scope02 ↓
---
#
↑ scope03 ↓
---
````

# 🌊Template
scope 内に `🌊name` を 1 行 (heading 直下推奨)。
省略時は `default`、 複数は後勝ち。

```markdown
# スライドタイトル
🌊title

# プロフィール
🌊me
```

# nwyt

## prop
`!key~value`のように書く。
対応するscopeにプロパティを指定する。
## content
`!key[value]`のように書く。
対応する位置を独自コンテンツで置き換える。

# meta
Set meta data like this.
````md
~~~meta
title:
description:
date:
~~~
````

# nwyt props 一覧
🌊default

| キー | 用途 |
| --- | --- |
| `!fl~text` | フッター左 |
| `!fr~text` | フッター右 |
| `!bg~[alt](url)` | 背景画像 |
| `!sub~text` | title のサブタイトル |
| `!icon~[alt](url)` | me のアイコン |
| `!lead~text` | message のリード |
| `!fn~[id]` | 脚注定義マーク |

# 脚注
🌊default

`!fn[id]` で上付きマーク !fn[1]。
hover で tooltip、 click で定義スライドへ !fn[2]。 別スライドも参照可 !fn[3]。

## 脚注1
!fn~[1]
**脚注1** の本文。Markdown 可。

## 脚注2
!fn~[2]
$e^{i\pi} + 1 = 0$ のような数式も。

# 別ページに置く脚注定義
!fn.head~[3]
🌊default

`!fn~[id]` を h1 直下に書けば、 そのスライド全体が脚注定義になる。
`.head` を付けると tooltip に heading も含まれる (default は body のみ)。

# 背景画像 — `!bg~`
!bg~[bg](/images/tgs.jpg)
🌊default

`!bg~[alt](url)` で section 全体に背景画像。
URL は `[alt](url)` / 素のパスどちらも可。 グローバルで全 section に伝播。

# フッター背景 — `!fbg~`
!fbg~[fbg](/images/tgs.jpg)
🌊default

`!fbg~[alt](url)` で footer 形状 (line + text) を mask に画像を切り抜く。
文字と線だけが「窓」になり背景が透ける。

# Templates
🌊solo

# Index
| テンプレート | 記法 | 特徴 |
| --- | --- | --- |
| default | `🌊default` | タイトル + 左寄せ body。通常スライド |
| title | `🌊title` | 中央左タイトル + サブタイトル + 固定画像 |
| me | `🌊me` | タイトル + アイコン左 + body 右 |
| message | `🌊message` | タイトル + 中央寄せ body + リードテキスト |
| solo | `🌊solo` | タイトルのみ中央寄せ、body なし |


# Default
🌊compare

## 
🌊default.window
preview

## 
```md
🌊default
preview
```

# title テンプレート
🌊title

!sub~中央左にタイトル、その下にサブタイトル。固定画像付き

# me テンプレート
🌊me

!icon~[icon](/henoheno.svg)

アイコン付き自己紹介スライド。
- 左 icon / 右 body
- `!icon~[alt](url)` でアイコン指定

# message テンプレート
🌊message

!lead~body の下に出るリードテキスト

中央寄せのコールアウト用。 タイトル / 本文 / `!lead~` の 3 段。

# solo テンプレート
🌊solo

# 基本 Markdown — テキスト装飾
🌊default

**太字** / *斜体* / ***太字斜体***

~~打ち消し線~~ / ==ハイライト==

インラインコード `const x = 1`

---

> 引用文
>
> 複数行の引用

# 基本 Markdown — リスト
🌊default

## 箇条書き・番号付き

- 箇条書き
  - ネスト項目
- 二番目

1. 番号付き
2. リスト

## チェックリスト

- [ ] 未完了タスク
- [x] 完了タスク

# 基本 Markdown — テーブル・リンク
🌊default

## テーブル

| 左寄せ | 中央 | 右寄せ |
| :----- | :---: | -----: |
| apple  |  赤   |    100 |
| banana |  黄   |     80 |
| cherry |  赤   |    120 |

## リンク・画像

[Nun リポジトリ](https://github.com/henohenon/henohe-Nun "GitHub") / [外部リンク](https://example.com)

![Nun ロゴ](/images/henohe-Nun.png "henohe-Nun")

# コードブロック
🌊default

## 言語指定

```js
const greet = (name) => `Hello, ${name}!`;
console.log(greet("Nun"));
```

## ファイル名・行番号

```ts:src/pipeline.ts#42
export async function process(md: string) {
  return pipeline.process(md);
}
```

## diff

```diff_ts
-const value = "old";
+const value = "new";
 console.log(value);
```

# コードブロック — 埋め込み
🌊default

## embed_svg

```embed_svg
<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="60" rx="8" fill="#1e293b"/>
  <text x="120" y="38" text-anchor="middle" fill="#60a5fa" font-size="22" font-family="monospace">embed_svg ✦</text>
</svg>
```

## embed_html

```embed_html
<div style="display:flex;gap:12px;flex-wrap:wrap">
  <div style="padding:12px 20px;background:#3b82f6;color:#fff;border-radius:8px">Button A</div>
  <div style="padding:12px 20px;background:#10b981;color:#fff;border-radius:8px">Button B</div>
  <div style="padding:12px 20px;background:#f59e0b;color:#fff;border-radius:8px">Button C</div>
</div>
```

## embed_mermaid

```embed_mermaid
flowchart LR
  MD[Markdown] --> micro[micromark]
  micro --> mdast[mdast]
  mdast --> hast[hast]
  hast --> HTML[HTML]
```

## embed_math

```embed_math
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0\varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
```

# 装飾ブロック — 種類
🌊default

:::note
**note** — 補足・メモ
:::

:::info
**info** — 追加情報
:::

:::tip
**tip** — ヒント・推奨
:::

:::warning
**warning** — 注意
:::

:::alert
**alert** — 強い警告
:::

# 装飾ブロック — ネスト
🌊default

::::note 外側のブロック
:::tip 内側のブロック
装飾ブロックはコロンを増やすことでネストできる。
:::
::::

# 数式
🌊default

## インライン

ピタゴラスの定理: $a^2 + b^2 = c^2$

オイラーの等式: $e^{i\pi} + 1 = 0$

## ブロック

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

# リンクカード
🌊default

## 横型（デフォルト）

!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

## 縦型（`.v`）

!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)

# FIN
🌊solo
