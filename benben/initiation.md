@date>2026/04/10
@fr>へのへ Nun
@fbg o=0.3 y=10vh right bottom>/henohe-Nun.png

# Initiation
@>title
## へのへ Nun

# Index
@>row
@gap>2rem
- [About](#2)
- Usage
  - Run
  - File Paths
  - Navigation
- Basic Syntax
  - Markdown
  - Code Block
  - HTML & UnoCSS
##
- Custom Syntax
  - Utility Tag
  - Original Tag
  - Img Attributes
- Templates
  - Overview
  - ...
# へのへ Nun
@>me
@icon mono>/henohe-Nun.webp
@fl>About
[へのへのん](https://github.com/henohenon/)'s md2slide project.
- Markdown→HTML/PDF/PNG Export
- Web-based Live Preview
- Responsive Rendering



@link>https://github.com/henohenon/henohe-Nun

# Usage
@>big

# Run
## Setup
```sh
bun i -f
bunx playwright i chromium   # for PDF/PNG/WebP export
```
need [ghostscript](https://ghostscript.com/releases/index.html) for compression PDF export.
## Commands
| Command                                | Description                                                    |
|----------------------------------------|----------------------------------------------------------------|
| `bun run dev`                          | Dev server (HMR)                                               |
| `bun run build`                        | SSG build → `dist/`                                            |
| `bun run build:pdf [deck]`             | PDF export → `dist/.pdf/`                                      |
| `bun run build:png [deck] [pages...]`  | PNG export → `dist/.png/`                                      |
| `bun run build:webp [deck] [pages...]` | WebP export → `dist/.webp/`                                    |
| `bun run build:thumbs`                 | OGP thumbnails (1200x630, first slide webp) → `public/thumbs/` |
| `bun run lint`                         | Biome lint/format check                                        |
| `bun run lint:fix`                     | Auto-fix                                                       |
| `bun run typecheck`                    | Type check (Astro + scripts)                                   |

# File Paths
Slide deck mds → `benben/`, images → `src/assets/images/` (or anywhere in `src/assets/`)
```md
project-root/
├── benben/
│   ├── my-talk.md        → /my-talk
│   └── private/
│       └── foo.md        → /private/foo
└── src/
  └── assets/
    └── images/
      └── photo.png       → /images/photo.png
```

# Navigation
| Key | Action |
|-----|--------|
| `→` `↓` `Space` `PageDown` `D` `S` | Next |
| `←` `↑` `PageUp` `A` `W` | Prev |
| `Enter` | Toggle fullscreen |
| `Home` / `End` | First / Last |

# Basic Syntax
@>big

# Markdown
@>row
@gap>5rem

## Preview
### heading
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
## Source
@>row
@gap>5rem
```md
## Preview
### heading
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
```

# Code Block
@>row
@gap>5rem
## Preview
basic
```ts
const greet = (name: string): string => `Hello, ${name}!`;
```
diff
```diff_rs
fn fibonacci(n: u32) -> u32 {
-     if n == 0 { return 0; }
+     match n {
+         0 => 0,
+         1 => 1,
+         _ => fibonacci(n - 1) + fibonacci(n - 2),
+     }
}
```
with filename
```cs:Point.cs
record Point(double X, double Y) {
    public double Distance() => Math.Sqrt(X * X + Y * Y);
}
```
with line number
```cpp#L42
template<typename T>
auto clamp(T val, T lo, T hi) {
    return val < lo ? lo : val > hi ? hi : val;
}
```
## Source

<div class="grid grid-flow-col gap-2">

````md
basic
```ts
const greet = (name: string): string => `Hello, ${name}!`;
```
diff
```diff_rs
fn fibonacci(n: u32) -> u32 {
-     if n == 0 { return 0; }
+     match n {
+         0 => 0,
+         1 => 1,
+         _ => fibonacci(n - 1) + fibonacci(n - 2),
+     }
}
```
````

````md
with filename
```cs:Point.cs
record Point(double X, double Y) {
    public double Distance() => Math.Sqrt(X * X + Y * Y);
}
```
with line number
```cpp#L42
template<typename T>
auto clamp(T val, T lo, T hi) {
    return val < lo ? lo : val > hi ? hi : val;
}
```
````

</div>

# HTML & UnoCSS
@>row
@gap>5rem
## Preview
<div id="game" class="relative w-full h-screen bg-slate-900 overflow-hidden font-mono">
  <div class="absolute bottom-0 w-full h-16 bg-slate-800"></div>
  <div id="player" class="absolute bottom-16 left-16 w-12 h-12 bg-blue-500 rounded"></div>
  <div id="obs" class="absolute bottom-16 right-0 w-10 h-20 bg-red-500 rounded"></div>
  <div id="score" class="absolute top-8 right-8 text-white text-4xl font-bold">0</div>
  <button id="btn" onclick="jump()" class="absolute bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 bg-blue-600 text-white cursor-pointer hover:bg-blue-500 active:scale-95">JUMP</button>
  <div id="msg" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-2xl">PRESS JUMP TO START</div>
</div>
<script>let y=0,vy=0,x=0,score=0,running=false,speed=4,jumping=false;const player=document.getElementById('player'),obs=document.getElementById('obs'),scoreEl=document.getElementById('score'),msg=document.getElementById('msg'),game=document.getElementById('game');window.jump=function(){if(!running){running=true;x=0;score=0;speed=4+Math.random()*3;msg.textContent='';loop();return;}if(!jumping){jumping=true;vy=16;}};function loop(){if(jumping){vy-=0.8;y+=vy;if(y<=0){y=0;vy=0;jumping=false;}}player.style.bottom=(64+y)+'px';x+=speed;const w=game.offsetWidth;if(x>w+40){x=0;score++;scoreEl.textContent=score;speed=4+Math.random()*3;}obs.style.right=x+'px';const obsLeft=w-x;const px=64,py=64+y,pw=48,ph=48;const ox=obsLeft,oy=64,ow=40,oh=80;if(px<ox+ow&&px+pw>ox&&py<oy+oh&&py+ph>oy){running=false;msg.textContent='GAME OVER - SCORE: '+score;return;}requestAnimationFrame(loop);}</script>
(Create .astro template is better.)


## Source
<div class="w-full h-screen">

```md
<div id="game" class="relative w-full h-screen bg-slate-900 overflow-hidden font-mono">
  <div class="absolute bottom-0 w-full h-16 bg-slate-800"></div>
  <div id="player" class="absolute bottom-16 left-16 w-12 h-12 bg-blue-500 rounded"></div>
  <div id="obs" class="absolute bottom-16 right-0 w-10 h-20 bg-red-500 rounded"></div>
  <div id="score" class="absolute top-8 right-8 text-white text-4xl font-bold">0</div>
  <button id="btn" onclick="jump()" class="absolute bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 bg-blue-600 text-white cursor-pointer hover:bg-blue-500 active:scale-95">JUMP</button>
  <div id="msg" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-2xl">PRESS JUMP TO START</div>
</div>
<script>...</script>
(Create .astro template is better.)
```

</div>

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

# **vertical**

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


# FIN.
@>small
