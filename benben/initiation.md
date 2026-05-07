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

##
🌊default.window
### Sub heading
- Title + left body
- Most slides use this
- h2 / h3 form sub-articles

##
````md
🌊default

### Sub heading
- Title + left body
- Most slides use this
- h2 / h3 form sub-articles
````


# Title
🌊compare
!fl~Templates

##
🌊title.window
!sub~Subtitle goes here in fg-mid color

##
````md
🌊title
!sub~Subtitle goes here in fg-mid color
````


# Me
🌊compare
!fl~Templates

##
🌊me.window
!icon~[icon](/henoheno.svg)

Profile-style intro.
- Icon column on the left
- Body content on the right
- Used for the About slide of this deck

##
````md
🌊me
!icon~[icon](/henoheno.svg)

Profile-style intro.
- Icon column on the left
- Body content on the right
- Used for the About slide of this deck
````


# Message
🌊compare
!fl~Templates

##
🌊message.window
!lead~Lead text in strong color

Centered callout body.
For single-message slides.

##
````md
🌊message
!lead~Lead text in strong color

Centered callout body.
For single-message slides.
````


# Solo
🌊compare
!fl~Templates

##
🌊default.window
Title-only slide, vertically centered.
Used for section breaks (Custom Syntax / Showcase / etc.).

##
````md
🌊solo

# Section title
````


# Compare
🌊compare
!fl~Templates

##
🌊default.window
Two-column layout for h2 articles.
Typical use: rendered preview vs source.
Combine with `.window` for a framed look.

##
````md
🌊compare

## left
left content

## right
right content
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
