@date>2026/04/10
@fr>へのへ Nun
@fbg o=0.3 y=10vh c=320deg right bottom shadow=10>/henohe-Nun.png

# Feature Tour
@>title
## へのへ Nun

# Index
- [About](#2)

# henohe Nun
@>me
@icon>/henohe-Nun.gif

[へのへのん](https://github.com/henohenon/)'s md2slide project.

# Basic Syntax
@>big

# Markdown
@>row
@gap>5rem
@theme>dark

##
**bold**, *italic*, ~~strikethrough~~, `code`, [link](https://github.com/henohenon/henohe-Nun)
> blockquote
- list item
  - nest

1. ordered list item
2. secondary

| A | B |
|---|---|
| 1 | 2 |

---

```js
console.log("code block");
```

```diff_js
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
```

```js:sample.js
const x = 1;
```

```ts#L1000
export function foo() {}
```

```diff_ts:utils.ts#L9
const x = 1;
+ const y = 2;
```

# Markdown
@>row
@gap>5rem

##
**bold**, *italic*, ~~strikethrough~~, `code`, [link](https://github.com/henohenon/henohe-Nun)
> blockquote
- list item
  - nest

1. ordered list item
2. secondary

| A | B |
|---|---|
| 1 | 2 |

---

```js
console.log("code block");
```

```diff_js
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
+ console.log("added");
- console.log("removed");
```

```js:sample.js
const x = 1;
```

```ts#L1000
export function foo() {}
```

```diff_ts:utils.ts#L9
const x = 1;
+ const y = 2;
```

##
````md
**bold**, *italic*, ~~strikethrough~~, `code`, [link](https://github.com/henohenon/henohe-Nun)
> blockquote

- list item
    - nest

1. ordered list item
    1. nested

| A | B |
|---|---|
| 1 | 2 |

---
```js
console.log("code block");
```
````

# HTML & UnoCSS


# Image Options
@>big

# @fr>, @fl>
`@fr>` right footer, `@fl>` left footer
Inline markdown supported

```md
@fr>2025/02/07
@fl>henohe **Nun**
```

# @bg>, @fbg>

`@bg>` slide background
`@fbg>` footer background (masked)

```md
@bg mono blur=5 bright=0.3>/photo.png
@fbg o=0.3 sepia>/texture.png
```

# Image Attributes

<div class="grid grid-flow-col gap-2">
<div>

position / size
| attr | effect |
|------|--------|
| `w` | width |
| `h` | height |
| `x` | translateX |
| `y` | translateY |
| `o` | opacity |
| `round` | border-radius |

</div>
<div>

filters
| attr | effect |
|------|--------|
| `mono` | grayscale |
| `sepia` | sepia tone |
| `bin` | black & white |
| `invert` | invert colors |
| `blur=N` | blur |
| `bright=N` | brightness |
| `contrast=N` | contrast |
| `saturate=N` | saturation |
| `hue=Ndeg` | hue rotate |

</div>
<div>

transform / misc
| attr | effect |
|------|--------|
| `cover` | cover (default: contain) |
| `rot=Ndeg` | rotate |
| `flip` | horizontal flip |
| `shadow=N` | drop-shadow |
| `c=Ndeg` | color tint |
| `top` `bottom` | vertical align |
| `left` `right` | horizontal align |
| `center` | center |

</div>
</div>

# @img Directive

`@img` embeds a styled image `<div>` in body

```md
@img cover>/photo.png
@img mono blur=3 o=0.5>/photo.png
```

@img>/henohe-Nun.png
@img mono blur=3 o=0.5>/photo.png


<div class="grid grid-flow-col gap-2">

@img cover>/henohe-Nun.png

@img mono c=200deg>/henohe-Nun.png

</div>

# @link Directive
**horizontal**

@link>https://github.com/henohenon/henohe-Nun
@link>https://www.youtube.com/shorts/YgRFiNOJAXc
@link>https://apps.apple.com/jp/app/id284882215
@link>https://zenn.dev/
@link>https://www.amazon.co.jp/%E3%80%90Amazon-co-jp%E9%99%90%E5%AE%9A%E3%80%91%E3%82%BF%E3%82%AA%E3%83%AB%E7%A0%94%E7%A9%B6%E6%89%80-%E3%83%9C%E3%83%AA%E3%83%A5%E3%83%BC%E3%83%A0%E3%83%AA%E3%83%83%E3%83%81-003-%E3%83%81%E3%83%A3%E3%82%B3%E3%83%BC%E3%83%AB%E3%82%B0%E3%83%AC%E3%83%BC-Technology/dp/B086WCH4FH/ref=zg_bs_c_kitchen_d_sccl_1/357-3233028-5814760?pd_rd_w=ltxRD&content-id=amzn1.sym.9dc95cfb-3370-41a8-b528-545fbe88c492&pf_rd_p=9dc95cfb-3370-41a8-b528-545fbe88c492&pf_rd_r=EFH84XHPA4X3N64SR07A&pd_rd_wg=oaCvy&pd_rd_r=34867164-cb78-4a73-b6a9-7df58f131ad4&pd_rd_i=B086WCH4FH&th=1

# **vertical**

@link v>https://github.com/henohenon/henohe-Nun
@link v>https://www.youtube.com/shorts/YgRFiNOJAXc
@link v>https://apps.apple.com/jp/app/id284882215
@link v>https://zenn.dev/
@link v>https://www.amazon.co.jp/%E3%80%90Amazon-co-jp%E9%99%90%E5%AE%9A%E3%80%91%E3%82%BF%E3%82%AA%E3%83%AB%E7%A0%94%E7%A9%B6%E6%89%80-%E3%83%9C%E3%83%AA%E3%83%A5%E3%83%BC%E3%83%A0%E3%83%AA%E3%83%83%E3%83%81-003-%E3%83%81%E3%83%A3%E3%82%B3%E3%83%BC%E3%83%AB%E3%82%B0%E3%83%AC%E3%83%BC-Technology/dp/B086WCH4FH/ref=zg_bs_c_kitchen_d_sccl_1/357-3233028-5814760?pd_rd_w=ltxRD&content-id=amzn1.sym.9dc95cfb-3370-41a8-b528-545fbe88c492&pf_rd_p=9dc95cfb-3370-41a8-b528-545fbe88c492&pf_rd_r=EFH84XHPA4X3N64SR07A&pd_rd_wg=oaCvy&pd_rd_r=34867164-cb78-4a73-b6a9-7df58f131ad4&pd_rd_i=B086WCH4FH&th=1

# Templates
@>big

# @>default
Heading + body text

```md
# Heading
Body content here.
```

# @>note
## Body centered + subtitle below
@>note

````md
# Heading
## Subtitle (shown below)
@>note
Body content (centered)
````

# @>me
@>me
@icon round=50%>/icon.png
Profile template
- `@icon>` icon on the left
- Body on the right

````md
# Name
@>me
@icon round=50%>/icon.png
Bio text
````

# @>title
Title slide.
`@date` auto-fills `fr`. `@fbg` doubles as `@bg`.

````md
@date>2025/02/07
@fbg o=0.3>/henohe-Nun.png
...
# Title
## Subtitle
@>title
````

# Title Sample
## Subtitle
@>title

# @>big
Large centered text

```md
# Big Text
@>big
```

# @>big Sample
@>big

# @>small
Small centered text

```md
# Small Text
@>small
```

# @>small Sample
@>small

# @>row
@>row

## Syntax
`## ` splits blocks horizontally.
`@gap>` controls spacing.
`@align>` controls horizontal alignment
(`left` / `center` / `right`, default `left`).

```md
# Heading
@>row
@gap>4em
@align>center

## Block A
- item
## Block B
- item
```

## Notes
- Content-driven widths
- H3 titles per block
- Pre-H2 content becomes a title-less leading block

# @>row Sample
@>row
@gap>3em
@align>center

## Pros
- Clean syntax
- No HTML needed
- Works with any markdown

## Cons
- Only horizontal
- No nested rows
- Fixed block order

# Export
- `build:pdf` — PDF
- `build:png` — per-slide PNG
- `build:webp` — OGP thumbnails

Playwright-based, accurate font rendering.

```sh
bun run build:pdf
bun run build:png
bun run build:webp
```

# FIN.
@>small
