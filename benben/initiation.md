~~~meta
title: Initiation
description: All-feature demo of Nun
date: 2026-05-07
~~~

!fr~2026/05/07
!fbg~[fbg](/images/henohe-Nun.png)

# Initiation
🌊title
!sub~All-feature demo of Nun
!bg~[bg](/images/henohe-Nun.png)


# Index
!fl~index
- About
- Custom Syntax
- Templates
  - Default / Title / Me / Message / Solo / Compare
- Markdown
- Code blocks
- Decoration blocks
- Math
- Card
- nwyt props
- Footnotes


# Nun
🌊me
!fl~about
!icon~[icon](/images/henohe-Nun.webp)

A static SSG slide tool by [henohenon](https://github.com/henohenon/).

- Markdown + custom syntax (`🌊` templates, `!` nwyt props)
- Static-first: rendered at build, runtime JS minimal
- DOM that mirrors Markdown semantics

!card~[GitHub](https://github.com/henohenon/henohe-Nun)


# Custom Syntax
🌊solo


# Scope
🌊default

Each scope spans from one heading to the next of equal or higher level.
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


# 🌊 Template
🌊compare

##
🌊.window
A `🌊name` line picks the template for the scope.
Default is `default`. Last wins.

##
````md
# Title page
🌊title

# Profile slide
🌊me
````


# nwyt — prop
🌊compare

##
🌊.window
`!key~value` — assigns a property to the scope.

##
````md
!fl~footer left text
!sub~subtitle of title template
````


# nwyt — content
🌊compare

##
🌊.window
`!key[value]` — replaces the inline position with custom content.

##
````md
inline !card[GitHub](https://github.com/...)
becomes a card.
````


# meta
🌊compare

##
🌊.window
Page metadata block (title / description / date / etc.).

##
````md
~~~meta
title: My Talk
description: All-feature demo
date: 2026-05-07
~~~
````


# nwyt props — keys
🌊default

| key | role |
| --- | --- |
| `!fl~text` | footer left |
| `!fr~text` | footer right |
| `!bg~[alt](url)` | background image |
| `!sub~text` | subtitle (title template) |
| `!icon~[alt](url)` | icon (me template) |
| `!lead~text` | lead text (message template) |
| `!fn~[id]` | footnote definition mark |


# Footnote — refs
🌊default

A reference renders as a sup mark !fn[1].

Hover for tooltip, click to jump to the definition slide !fn[2].

Cross-slide definitions work too !fn[3].

## Footnote 1
!fn~[1]

**Footnote 1** body. Markdown is allowed.

## Footnote 2
!fn~[2]

Math is allowed: $e^{i\pi} + 1 = 0$.


# Footnote on a dedicated slide
!fn.head~[3]
🌊default

This whole slide is the body of footnote 3.

`!fn~[id]` at section level (h1 scope) makes the slide itself the definition.
`.head` includes the heading in the tooltip; default is body only.


# `!bg~`
!bg~[bg](/images/tgs.jpg)
🌊default

`!bg~[alt](url)` lays an image behind the slide.

`[alt](url)` or a bare path; global setting propagates to all slides.


# `!fbg~`
!fbg~[fbg](/images/tgs.jpg)
🌊default

`!fbg~[alt](url)` masks an image with the footer's SVG shapes (line + text).

Only the footer line and text show through, framing the image.


# Templates
🌊solo


# Templates — index
🌊default

| template | syntax | feature |
| --- | --- | --- |
| default | `🌊default` | title + left body (standard) |
| title | `🌊title` | center-left title + sub + fixed image |
| me | `🌊me` | title + icon left + body right |
| message | `🌊message` | title + centered body + lead |
| solo | `🌊solo` | title only, centered, no body |
| compare | `🌊compare` | two-column comparison (h2 articles side by side) |


# Default
🌊compare

##
🌊.window
title + left body. The standard slide.

##
````md
🌊default
title + body
````


# Title
🌊compare

##
🌊.window
🌊title
!sub~Subtitle text

##
````md
🌊title
!sub~Subtitle text
````


# Me
🌊compare

##
🌊.window
🌊me
!icon~[icon](/henoheno.svg)

icon left, body right.

##
````md
🌊me
!icon~[icon](/henoheno.svg)

icon left, body right.
````


# Message
🌊compare

##
🌊.window
🌊message
!lead~Lead text below the body

centered body.

##
````md
🌊message
!lead~Lead text below the body

centered body.
````


# Solo
🌊compare

##
🌊.window
title only, centered.

##
````md
🌊solo
````


# Compare
🌊compare

##
🌊.window
two h2 articles side by side.

##
````md
🌊compare

## h2 left
left

## h2 right
right
````


# Markdown — text decoration
🌊compare

##
🌊.window
**bold** / *italic* / ***bold italic***

~~strike~~ / ==mark==

inline `const x = 1`

> quote
> multi-line

##
````md
**bold** / *italic* / ***bold italic***

~~strike~~ / ==mark==

inline `const x = 1`

> quote
> multi-line
````


# Markdown — lists
🌊compare

##
🌊.window
- bullet
  - nested
- second

1. ordered
2. list

- [ ] open
- [x] done

##
````md
- bullet
  - nested
- second

1. ordered
2. list

- [ ] open
- [x] done
````


# Markdown — tables / links
🌊compare

##
🌊.window
| left | center | right |
| :--- | :---: | ---: |
| apple | red | 100 |
| banana | yellow | 80 |

[Nun repo](https://github.com/henohenon/henohe-Nun "GitHub")

##
````md
| left | center | right |
| :--- | :---: | ---: |
| apple | red | 100 |
| banana | yellow | 80 |

[Nun repo](https://github.com/...)
````


# Code — language
🌊compare

##
🌊.window
```js
const greet = (n) => `Hi, ${n}!`;
console.log(greet("Nun"));
```

##
`````md
```js
const greet = (n) => `Hi, ${n}!`;
console.log(greet("Nun"));
```
`````


# Code — filename / start line
🌊compare

##
🌊.window
```ts:src/pipeline.ts#42
export async function process(md: string) {
  return pipeline.process(md);
}
```

##
`````md
```ts:src/pipeline.ts#42
export async function process(md: string) {
  return pipeline.process(md);
}
```
`````


# Code — diff
🌊compare

##
🌊.window
```diff_ts
-const value = "old";
+const value = "new";
 console.log(value);
```

##
`````md
```diff_ts
-const value = "old";
+const value = "new";
 console.log(value);
```
`````


# Code — embed_svg
🌊compare

##
🌊.window
```embed_svg
<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="60" rx="8" fill="#1e293b"/>
  <text x="120" y="38" text-anchor="middle" fill="#60a5fa" font-size="22" font-family="monospace">embed_svg ✦</text>
</svg>
```

##
`````md
```embed_svg
<svg viewBox="0 0 240 60" ...>
  ...
</svg>
```
`````


# Code — embed_html
🌊compare

##
🌊.window
```embed_html
<div style="display:flex;gap:12px;flex-wrap:wrap">
  <div style="padding:12px 20px;background:#3b82f6;color:#fff;border-radius:8px">A</div>
  <div style="padding:12px 20px;background:#10b981;color:#fff;border-radius:8px">B</div>
  <div style="padding:12px 20px;background:#f59e0b;color:#fff;border-radius:8px">C</div>
</div>
```

##
`````md
```embed_html
<div style="...">
  <div>A</div> <div>B</div> <div>C</div>
</div>
```
`````


# Code — embed_mermaid
🌊compare

##
🌊.window
```embed_mermaid
flowchart LR
  MD[Markdown] --> micro[micromark]
  micro --> mdast[mdast]
  mdast --> hast[hast]
  hast --> HTML[HTML]
```

##
`````md
```embed_mermaid
flowchart LR
  MD --> micro
  micro --> mdast
  mdast --> hast
  hast --> HTML
```
`````


# Code — embed_math
🌊compare

##
🌊.window
```embed_math
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0\varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
```

##
`````md
```embed_math
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + ...
\end{aligned}
```
`````


# Decoration blocks — kinds
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


# Decoration blocks — nested
🌊compare

##
🌊.window
::::note Outer
:::tip Inner
Increase the colon count to nest.
:::
::::

##
````md
::::note Outer
:::tip Inner
Increase the colon count to nest.
:::
::::
````


# Math
🌊compare

##
🌊.window
Pythagoras: $a^2 + b^2 = c^2$

Euler: $e^{i\pi} + 1 = 0$

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

##
````md
Pythagoras: $a^2 + b^2 = c^2$

Euler: $e^{i\pi} + 1 = 0$

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
````


# Card — horizontal
🌊compare

##
🌊.window
!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)

##
````md
!card[henohe-Nun](https://github.com/henohenon/henohe-Nun)
````


# Card — vertical (`.v`)
🌊compare

##
🌊.window
!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)

##
````md
!card.v[henohe-Nun](https://github.com/henohenon/henohe-Nun)
````


# FIN
🌊solo
