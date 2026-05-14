~~~meta
title: Initiation
description: All-syntax demo of へのへ Nun
date: 2026-05-07
~~~

!fr~2026/05/07
!fbg.at-br.ty-8%.lg.mono~[fbg](/images/henohe-Nun.png)

# Initiation
🌊title
!sub~へのへNun's all demo
!fbg.^mono~
!bg~=fbg


# Index

- About
  - [へのへ Nun](#3) / [Navigation](#4)
- [Custom Syntax](#5)
  - [Scope](#6) / [🌊 Template](#7) / [nwyt](#8) / [meta](#9)
- [Showcase](#10)
  - [Templates](#11) — [Default](#12) / [Title](#13) / [Me](#14) / [Message](#15) / [Solo](#16) / [Compare](#17)
  - [Basic Markdown](#18) — [Text](#19) / [Lists](#20) / [Tables](#21) / [Code](#22) / [Embed](#23) / [Decoration](#24) / [Nested](#25) / [Math](#26)
  - [Custom Content](#27) — [nwyt list](#28) / [Footnote](#29) / [Footnote dedicated](#30) / [Background](#31) / [Footer bg](#32) / [Card](#33)


# へのへ Nun
🌊me
!fl~About
!icon~[icon](/images/henohe-Nun.webp)

[へのへのん](https://github.com/henohenon)'s md2Slide tool
- DOM that mirrors Markdown semantics
- Responsive Rendering


# Navigation
🌊default
!fl~About

| key / gesture | action |
| --- | --- |
| `→` `↓` `Space` `D` `S` | Next slide |
| `←` `↑` `A` `W` | Prev slide |
| `Home` / `End` | First / Last |
| `Enter` | Toggle fullscreen |
| Click left half (fullscreen) | Prev |
| Click right half (fullscreen) | Next |
| Touch swipe | Prev / Next |
| Mouse wheel | Prev / Next |


# Custom Syntax
🌊solo


# Scope
!fl~Custom Syntax
A scope spans from one heading to the next of equal or higher level.
Anything before the first heading is the global default.

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
!fl~Custom Syntax
Pick a template per scope with `🌊name` on its own line (right under the heading).
Default is `default`. Last wins.

```markdown
# Slide title
🌊title

# Profile
🌊me
```


# nwyt
!fl~Custom Syntax

## prop
`!key~value` — assign a property to the surrounding scope.

```md
# Slide
🌊default
!fl~footer left
!bg~[bg](/img.png)

body
```

## content
`!key[value]` — replace the inline position with custom content.

```md
inline !card[GitHub](https://github.com/...)
or refs like !fn[1] become sup marks
```


# meta
!fl~Custom Syntax
Page meta block (title / description / date / etc.).
````md
~~~meta
title:
description:
date:
~~~
````


# Showcase
🌊solo


# Templates
🌊default

| template | feature |
| --- | --- |
| [`🌊default`](#12) | title + left body (standard) |
| [`🌊title`](#13) | center-left title + sub + fixed image |
| [`🌊me`](#14) | icon left + body right |
| [`🌊message`](#15) | centered body + lead |
| [`🌊solo`](#16) | title only, centered, no body |
| [`🌊compare`](#17) | two-column comparison (h2 articles) |


# Default
🌊compare
!fl~Templates

## Preview
🌊default.window

### Sub heading
- bullet
- nested
- items

paragraph text

##
````md
🌊default

### Sub heading
- bullet
- nested
- items

paragraph text
````


# Title
🌊compare
!fl~Templates

## Preview
🌊title.window
!sub~Subtitle text

##
````md
🌊title
!sub~Subtitle text
````


# Me
🌊compare
!fl~Templates

## Preview
🌊me.window
!icon~[icon](/henoheno.svg)

- bullet
- bullet

##
````md
🌊me
!icon~[icon](/henoheno.svg)

- bullet
- bullet
````


# Message
🌊compare
!fl~Templates

## Preview
🌊message.window
!lead~Lead text

Body text

##
````md
🌊message
!lead~Lead text

Body text
````


# Solo
🌊compare
!fl~Templates

## Preview
🌊solo.window

##
````md
🌊solo
````


# Compare
🌊compare
!fl~Templates

## Preview
🌊compare.window

### left
A

### right
B

##
````md
🌊compare

## left
A

## right
B
````


# Basic Markdown
🌊solo


# Markdown — text decoration
🌊default
!fl~Basic Markdown

**bold** / *italic* / ***bold italic***

~~strike~~ / ==mark==

inline `const x = 1`

---

> blockquote
>
> multi-line


# Markdown — lists
🌊default
!fl~Basic Markdown

## bullet / ordered

- bullet
  - nested
- second

1. ordered
2. list

## checklist

- [ ] open task
- [x] done task


# Markdown — tables / links
🌊default
!fl~Basic Markdown

## table

| left | center | right |
| :----- | :---: | -----: |
| apple  |  red   |    100 |
| banana | yellow |     80 |
| cherry |  red   |    120 |

## links / images

[Nun repo](https://github.com/henohenon/henohe-Nun "GitHub") / [external](https://example.com)

![Nun logo](/images/henohe-Nun.png "henohe-Nun")

!.rounded-lg.shadow-xl[Nun logo with class](/images/henohe-Nun.png)
!.opacity-50[半透明](/images/henohe-Nun.png)
!.grayscale[モノクロ](/images/henohe-Nun.png)
!.hue-rotate-180[色相反転](/images/henohe-Nun.png)


# Code block
🌊default
!fl~Basic Markdown

## language

```js
const greet = (name) => `Hello, ${name}!`;
console.log(greet("Nun"));
```

## filename / start line

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


# Code block — embed
🌊default
!fl~Basic Markdown

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


# Decoration block — kinds
🌊default
!fl~Basic Markdown

:::note
**note** — supplemental remark
:::

:::info
**info** — extra information
:::

:::tip
**tip** — recommendation
:::

:::warning
**warning** — caution
:::

:::alert
**alert** — strong warning
:::


# Decoration block — nested
🌊default
!fl~Basic Markdown

::::note Outer
:::tip Inner
Add more colons to nest.
:::
::::


# Math
🌊default
!fl~Basic Markdown

## inline

Pythagoras: $a^2 + b^2 = c^2$

Euler: $e^{i\pi} + 1 = 0$

## block

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$


# Custom Content
🌊solo


# nwyt list
🌊default
!fl~Custom Content

| key | kind | role |
| --- | --- | --- |
| `!fl~text` | prop | footer left |
| `!fr~text` | prop | footer right |
| [`!bg~[alt](url)`](#31) | prop | background image |
| [`!fbg~[alt](url)`](#32) | prop | footer background |
| [`!sub~text`](#13) | prop | subtitle (title template) |
| [`!icon~[alt](url)`](#14) | prop | icon (me template) |
| [`!lead~text`](#15) | prop | lead (message template) |
| [`!fn~[id]`](#29) | prop | footnote definition |
| [`!fn[id]`](#29) | content | footnote reference |
| [`!card[label](url)`](#33) | content | OGP link card |
| [`!card.v[label](url)`](#33) | content | vertical card |


# Footnote
🌊default
!fl~Custom Content

`!fn[id]` renders a sup mark !fn[1].
Hover for tooltip, click to jump !fn[2]. Cross-slide refs work too !fn[3].

## Footnote 1
!fn~[1]
**Footnote 1** body. Markdown is allowed.

## Footnote 2
!fn~[2]
Math is allowed too: $e^{i\pi} + 1 = 0$.


# Footnote on a dedicated slide
!fn.head~[3]
🌊default
!fl~Custom Content

`!fn~[id]` at h1 scope makes the whole slide the body of the footnote.
`.head` includes the heading in the tooltip (default: body only).


# Background — `!bg~`
!bg.object-bottom~[bg](/images/tgs.jpg)
🌊default
!fl~Custom Content

`!bg~[alt](url)` lays an image behind the slide.
`[alt](url)` or a bare path. Global setting propagates to all slides.
`.class` で UnoCSS class を上乗せ可 (`!bg.object-bottom~` で下端寄せ等)。


# Footer background — `!fbg~`
!fbg~[fbg](/images/tgs.jpg)
🌊default
!fl~Custom Content

`!fbg~[alt](url)` masks an image with the footer's SVG shapes (line + text).
Only the line and text show through, framing the image.


# Class — image utility (統一 namespace)
🌊default
!fl~Class

img-direct / bg / fbg / icon の **全 image-mechanism で同一 class が同一概念**。
`!.<class>[alt](url)` で `<img class="..." />` を生成、 `!bg.<class>~` や `!icon.<class>~` でも同じ class が効く。

| カテゴリ | 例 |
| --- | --- |
| Layout | `.cover` / `.at-{tl,t,tr,l,c,r,bl,b,br}` |
| Nudge | `.tx-<n><unit>` / `.ty-<n><unit>` (translate 微調整、 単位 `%` `px` `em` `cqmin` 等、 負号は先頭 `-`) |
| Opacity | `.op-<n>` (n = 0-100、 `opacity: n/100`) |
| Subtract | `.^<class>` (継承 list から指定 class を除去、 例 `.^mono`) |
| Size | `.sm` / `.md` / `.lg` / `.xl` |
| Shape | `.round` / `.circle` |
| Aspect | `.aspect-{square,video,portrait}` |
| Effects | `.dim` / `.haze` / `.mono` / `.invert` / `.fade` / `.shadow` / `.frame` / `.tint-brand` / `.flip-{h,v}` |

!.round[round](/images/henohe-Nun.png)
!.mono[mono](/images/henohe-Nun.png)
!.dim[dim](/images/henohe-Nun.png)
!.tx-20%.ty--20%[nudged](/images/henohe-Nun.png)
!.op-30[op30](/images/henohe-Nun.png)
!.tx-10%.op-50[combined](/images/henohe-Nun.png)


# Class — scope (`.no-footer` / `.table-zebra` 等)
🌊default.table-zebra
!fl~Class

scope (section / article) に付ける class。 この slide は `🌊default.table-zebra` で table がストライプ装飾。

| col 1 | col 2 | col 3 |
| --- | --- | --- |
| apple | red | 100 |
| banana | yellow | 80 |
| cherry | red | 120 |
| date | brown | 60 |

他: `.dark` / `.hierarchy` / `.window` / `.brand-quote` / `.code-bare` / `.no-footer` / `.table-bordered`


# Custom — 値 ref + var inline
🌊default
!fl~Class
!color-brand~#ff00ff

**値 reference `!bg~=<key>`**: 別 nwyt の値を mirror。 同 URL の重複記述回避。

```md
!fbg~[](/img/example.png)
!bg~=fbg     # fbg の URL + class を mirror
```

**var inline (escape hatch) `!<prefix>-<name>~<value>`**: CSS 変数を scope に直接 set。 この slide は `!color-brand~#ff00ff` で `--brand` を マゼンタに override。

```md
!color-brand~#ff00ff
!color-base~#0a0a0a
!size-radius~12px
```

通常は scope class (`!color-brand` の代わりに `.crimson-deck` 等 CSS で定義) を推奨、 var inline は **1 回限り** 例外用 escape hatch。


# Link card
🌊default
!fl~Custom Content

## horizontal (default)

!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

## vertical (`.v`)

!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)


# FIN
🌊solo
