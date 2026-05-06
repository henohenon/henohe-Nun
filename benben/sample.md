~~~meta
title: Nun 記法一覧
description: Nun の全記法デモスライド
date: 2026-05-01
~~~

!fl~**Nun** 記法一覧
!fr~2026/05/01

# Nun 記法一覧
🌊title

!sub~Markdown スライドツールの全機能デモ

# テンプレート一覧
🌊default

| テンプレート | 記法 | 特徴 |
| --- | --- | --- |
| default | `🌊default` | タイトル + 左寄せ body。通常スライド |
| title | `🌊title` | 中央左タイトル + サブタイトル + 固定画像 |
| me | `🌊me` | タイトル + アイコン左 + body 右 |
| message | `🌊message` | タイトル + 中央寄せ body + リードテキスト |
| solo | `🌊solo` | タイトルのみ中央寄せ、body なし |

# テンプレートの指定方法
🌊default

対象 heading から次 heading 直前までの範囲のどこかに `🌊name` を記述する (推奨は heading の直下)。

省略した場合は `default` として扱われる。

```markdown
# スライドタイトル
🌊title

# プロフィール
🌊me
```

# title テンプレート
🌊title

!sub~中央左にタイトル、その下にサブタイトル。固定画像付き

# me テンプレート
🌊me

!icon~[icon](/henoheno.svg)

アイコン付き自己紹介スライド。

- `!icon~[alt](url)` でアイコン画像を指定
- 左にアイコン、右に body が並ぶ

# message テンプレート
🌊message

!lead~body の下に表示されるリードテキスト

タイトルの下に本文、さらに下に `!lead~` のテキスト。

中央寄せのコールアウト的スライドに使う。

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

# nwyt prop 一覧
🌊default

| キー | 用途 |
| --- | --- |
| `!fl~text` | フッター左テキスト |
| `!fr~text` | フッター右テキスト |
| `!bg~[alt](url)` | 背景画像 |
| `!sub~text` | title テンプレートのサブタイトル |
| `!icon~[alt](url)` | me テンプレートのアイコン |
| `!lead~text` | message テンプレートのリード |
| `!fn~[id]` | 脚注定義マーク |

# 脚注
🌊default

## 参照

本文中に上付きマーク !fn[1] が挿入される。

ホバーで内容の tooltip、クリックで定義スライドに遷移する !fn[2]。

別スライドに定義された脚注も参照できる !fn[3]。

## 脚注1の定義
!fn~[1]

**脚注1** の内容テキスト。Markdown が使える。

`!fn~[1]` を nwyt prop として記述した article の body 全体が内容になる。

## 脚注2の定義
!fn~[2]

脚注2の内容。$e^{i\pi} + 1 = 0$ のように数式も使える。

# 別ページに置く脚注定義
!fn.head~[3]
🌊default

このスライド全体が脚注 3 の定義になる。`!fn~[id]` を section レベル (h1 直下) に書くと、スライドそのものを脚注の定義として登録できる。

参照側 (`!fn[3]`) からはクリックでこのスライドに遷移し、ホバー時の tooltip にはこのスライドの本文がそのまま展開される。`!fn.head~[id]` のように `.head` クラスを付けると、tooltip に heading も含める (デフォルトは body のみ)。

# おわり
🌊solo
