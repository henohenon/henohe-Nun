~~~meta
title: Initiation
description: All-syntax demo of へのへ Nun
date: 2026-05-07
~~~

!fr~2026/05/07
!fbg~[fbg](/images/henohe-Nun.png)

# Initiation
🌊title
!sub~へのへNun's all demo
!bg~[bg](/images/henohe-Nun.png)


# Index

- [About](#3)
- [Custom Syntax](#4)
  - [Scope](#5) / [🌊 Template](#6) / [nwyt](#7) / [meta](#8)
- [Showcase](#9)
  - [Templates](#10) — [Default](#11) / [Title](#12) / [Me](#13) / [Message](#14) / [Solo](#15)
  - [Basic Markdown](#16) — [Text](#17) / [Lists](#18) / [Tables](#19) / [Code](#20) / [Embed](#21) / [Decoration](#22) / [Nested](#23) / [Math](#24)
  - [Custom Content](#25) — [nwyt list](#26) / [Footnote](#27) / [Footnote dedicated](#28) / [Background](#29) / [Footer bg](#30) / [Card](#31)


# へのへ Nun
🌊me
!icon~[icon](/images/henohe-Nun.webp)

[へのへのん](https://github.com/henohenon)'s md2Slide tool
- DOM that mirrors Markdown semantics
- Responsive Rendering


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
| [`🌊default`](#11) | title + left body (standard) |
| [`🌊title`](#12) | center-left title + sub + fixed image |
| [`🌊me`](#13) | icon left + body right |
| [`🌊message`](#14) | centered body + lead |
| [`🌊solo`](#15) | title only, centered, no body |
| `🌊compare` | two-column comparison (h2 articles) |


# Default
🌊compare
!fl~Templates

## 
🌊default.window
preview

## 
```md
🌊default
preview
```


# Title
🌊compare
!fl~Templates

##
🌊title.window
!sub~Center-left title + subtitle + fixed image

##
````md
🌊title
!sub~Center-left title + subtitle + fixed image
````


# Me
🌊compare
!fl~Templates

##
🌊me.window
!icon~[icon](/henoheno.svg)

Profile-style slide. icon left, body right.

##
````md
🌊me
!icon~[icon](/henoheno.svg)

Profile-style slide. icon left, body right.
````


# Message
🌊compare
!fl~Templates

##
🌊message.window
!lead~Lead text below the body

Centered callout body.

##
````md
🌊message
!lead~Lead text below the body

Centered callout body.
````


# Solo
🌊compare
!fl~Templates

##
🌊solo.window

##
````md
🌊solo
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
| [`!bg~[alt](url)`](#29) | prop | background image |
| [`!fbg~[alt](url)`](#30) | prop | footer background |
| [`!sub~text`](#12) | prop | subtitle (title template) |
| [`!icon~[alt](url)`](#13) | prop | icon (me template) |
| [`!lead~text`](#14) | prop | lead (message template) |
| [`!fn~[id]`](#27) | prop | footnote definition |
| [`!fn[id]`](#27) | content | footnote reference |
| [`!card[label](url)`](#31) | content | OGP link card |
| [`!card.v[label](url)`](#31) | content | vertical card |


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
!bg~[bg](/images/tgs.jpg)
🌊default
!fl~Custom Content

`!bg~[alt](url)` lays an image behind the slide.
`[alt](url)` or a bare path. Global setting propagates to all slides.


# Footer background — `!fbg~`
!fbg~[fbg](/images/tgs.jpg)
🌊default
!fl~Custom Content

`!fbg~[alt](url)` masks an image with the footer's SVG shapes (line + text).
Only the line and text show through, framing the image.


# Link card
🌊default
!fl~Custom Content

## horizontal (default)

!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

## vertical (`.v`)

!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)


# FIN
🌊solo
