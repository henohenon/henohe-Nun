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
!fl~index

- [About](#3)
- [Custom Syntax](#4)
  - [Scope](#5) / [🌊 Template](#6) / [nwyt](#7) / [meta](#8) / [nwyt props](#9)
- [Showcase](#10)
  - [Templates](#11) — [Default](#12) / [Title](#13) / [Me](#14) / [Message](#15) / [Solo](#16)
  - [Basic Markdown](#17) — [Text](#18) / [Lists](#19) / [Tables](#20) / [Code](#21) / [Embed](#22) / [Decoration](#23) / [Nested](#24) / [Math](#25)
  - [Custom Content](#26) — [Footnote](#27) / [Footnote dedicated](#28) / [Background](#29) / [Footer bg](#30) / [Card](#31)


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
Pick a template per scope with `🌊name` on its own line (right under the heading).
Default is `default`. Last wins.

```markdown
# Slide title
🌊title

# Profile
🌊me
```


# nwyt

## prop
`!key~value` — assign a property to the surrounding scope.

## content
`!key[value]` — replace the inline position with custom content.


# meta
Page meta block (title / description / date / etc.).
````md
~~~meta
title:
description:
date:
~~~
````


# nwyt props
🌊default

| key | role |
| --- | --- |
| `!fl~text` | footer left |
| `!fr~text` | footer right |
| `!bg~[alt](url)` | background image |
| `!sub~text` | subtitle (title template) |
| `!icon~[alt](url)` | icon (me template) |
| `!lead~text` | lead (message template) |
| `!fn~[id]` | footnote definition mark |


# Showcase
🌊solo


# Templates
🌊solo


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


# Title
🌊compare

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

**bold** / *italic* / ***bold italic***

~~strike~~ / ==mark==

inline `const x = 1`

---

> blockquote
>
> multi-line


# Markdown — lists
🌊default

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

::::note Outer
:::tip Inner
Add more colons to nest.
:::
::::


# Math
🌊default

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


# Footnote
🌊default

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

`!fn~[id]` at h1 scope makes the whole slide the body of the footnote.
`.head` includes the heading in the tooltip (default: body only).


# Background — `!bg~`
!bg~[bg](/images/tgs.jpg)
🌊default

`!bg~[alt](url)` lays an image behind the slide.
`[alt](url)` or a bare path. Global setting propagates to all slides.


# Footer background — `!fbg~`
!fbg~[fbg](/images/tgs.jpg)
🌊default

`!fbg~[alt](url)` masks an image with the footer's SVG shapes (line + text).
Only the line and text show through, framing the image.


# Link card
🌊default

## horizontal (default)

!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

## vertical (`.v`)

!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)


# FIN
🌊solo
