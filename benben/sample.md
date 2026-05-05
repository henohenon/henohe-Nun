~~~meta
title: Nun 記法一覧
description: Nun の全記法デモスライド
date: 2026-05-01
~~~

!fl~**Nun** 記法一覧
!fr~2026/05/01

🌊title
# Nun 記法一覧

!sub~Markdown スライドツールの全機能デモ

🌊default
# テンプレート一覧

## 種類

| テンプレート | 記法 | 特徴 |
| --- | --- | --- |
| default | `🌊default` | タイトル + 左寄せ body。通常スライド |
| title | `🌊title` | 中央左タイトル + サブタイトル + 固定画像 |
| me | `🌊me` | タイトル + アイコン左 + body 右 |
| message | `🌊message` | タイトル + 中央寄せ body + リードテキスト |
| solo | `🌊solo` | タイトルのみ中央寄せ、body なし |

## 指定方法

見出し（`#`）の直前に記述する。

省略した場合は `default` として扱われる。

```markdown
🌊title
# スライドタイトル

🌊me
# プロフィール
```

🌊title
# title テンプレート

!sub~中央左にタイトル、その下にサブタイトル。固定画像付き

🌊me
# me テンプレート

!icon~[icon](/images/icon.png)

アイコン付き自己紹介スライド。

- `!icon~[alt](url)` でアイコン画像を指定
- 左にアイコン、右に body が並ぶ

🌊message
# message テンプレート

!lead~body の下に表示されるリードテキスト

タイトルの下に本文、さらに下に `!lead~` のテキスト。

中央寄せのコールアウト的スライドに使う。

🌊solo
# solo テンプレート

🌊default
# 基本 Markdown

## テキスト装飾

**太字** / *斜体* / ***太字斜体***

~~打ち消し線~~ / ==ハイライト==

インラインコード `const x = 1`

---

> 引用文
>
> 複数行の引用

## リスト

- 箇条書き
  - ネスト項目
- 二番目

1. 番号付き
2. リスト

- [ ] 未完了タスク
- [x] 完了タスク

## テーブル

| 左寄せ | 中央 | 右寄せ |
| :----- | :---: | -----: |
| apple  |  赤   |    100 |
| banana |  黄   |     80 |
| cherry |  赤   |    120 |

## リンク・画像

[Nun リポジトリ](https://github.com/henohenon/henohe-Nun "GitHub") / [外部リンク](https://example.com)

![Nun ロゴ](/images/henohe-Nun.png "henohe-Nun")

🌊default
# コードブロック

## 基本

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

## diff 表示

```diff_ts
-const value = "old";
+const value = "new";
 console.log(value);
```

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

🌊default
# 装飾ブロック

## 種類

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

## 折りたたみ・タイトル

:::note+ 開いた補足ブロック
初期状態で展開されている。`:::note+` で指定。
:::

:::warning- 閉じた警告ブロック
クリックで展開できる。`:::warning-` で指定。
:::

## ネスト

::::note 外側のブロック
:::tip 内側のブロック
装飾ブロックはコロンを増やすことでネストできる。
:::
::::

🌊default
# 数式

## インライン数式

ピタゴラスの定理: $a^2 + b^2 = c^2$

オイラーの等式: $e^{i\pi} + 1 = 0$

## ブロック数式

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

🌊default
# リンクカード

## 横型（デフォルト）

!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

## 縦型（`.v`）

!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)

🌊default
# nwyt・脚注

## nwyt prop（消費される）

| キー | 用途 |
| --- | --- |
| `!fl~text` | フッター左テキスト |
| `!fr~text` | フッター右テキスト |
| `!bg~[alt](url)` | 背景画像 |
| `!sub~text` | title テンプレートのサブタイトル |
| `!icon~[alt](url)` | me テンプレートのアイコン |
| `!lead~text` | message テンプレートのリード |
| `!fn~[id]` | 脚注定義マーク |

## 脚注参照

本文中に上付きマーク !fn[1] が挿入される。

ホバーで内容の tooltip、クリックで定義スライドに遷移する !fn[2]。

## 脚注1の定義
!fn~[1]

**脚注1** の内容テキスト。Markdown が使える。

`!fn~[1]` を nwyt prop として記述した article の body 全体が内容になる。

## 脚注2の定義
!fn~[2]

脚注2の内容。$e^{i\pi} + 1 = 0$ のように数式も使える。

🌊solo
# おわり
