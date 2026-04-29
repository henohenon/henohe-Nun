---
date: 2026/04/10
---
へのへ Nun~fr
![](/henohe-Nun/images/henohe-Nun.png)~fbg

# Initiation
🌊title
## へのへ Nun

# Index
- [About](#2)
- [Usage](#3)
  - [Run](#4)
  - [File Paths](#5)
  - [Navigation](#6)
- [Basic Syntax](#7)
  - [Markdown](#8)
  - [Code Block](#9)
  - [HTML & UnoCSS](#10)
##
- [Custom Syntax](#11)
  - [Overview](#12)
- [Templates & Classes](#13)
  - [Default](#14) / [Note](#15) / [Me](#16) / [Title](#17)
  - [Big](#19) / [Small](#21)
- Customization
  - [Footer & Background](#23)
  - [CSS Variables](#24)

# へのへ Nun
🌊me
![icon](/henohe-Nun/images/icon.png)~icon

About~fl
[へのへのん](https://github.com/henohenon/)'s md2slide project.
- Markdown→HTML/PDF/PNG Export
- Web-based Live Preview
- Responsive Rendering

[GitHub](https://github.com/henohenon/henohe-Nun)~card
![add image](/henohe-Nun/images/icon.png)


# Usage
🌊big


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
| `bun run typecheck`                    | Type check                                                     |

# File Paths
Slide deck mds → `benben/`, images → `public/images/`
```md
project-root/
├── benben/
│   ├── my-talk.md        → /my-talk
│   └── private/
│       └── foo.md        → /private/foo
└── public/
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
🌊big

# Markdown
.row

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
.row

## Preview
### fence
.row
🌊note
.henoheno
aflwwekl
fklwjekfwe~caption
### fence
#### fselj
### fence
#### fselj
#### fselj
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
.row

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

# HTML & UnoCSS
🌊note
.row.h-full.content-stretch.auto-rows-auto
## new template is better
### Preview
<div id="game" class="relative w-full h-screen bg-slate-900 overflow-hidden font-mono">
  <div class="absolute bottom-0 w-full h-16 bg-slate-800"></div>
  <div id="player" class="absolute bottom-16 left-16 w-12 h-12 bg-blue-500 rounded"></div>
  <div id="obs" class="absolute bottom-16 right-0 w-10 h-20 bg-red-500 rounded"></div>
  <div id="score" class="absolute top-8 right-8 text-white text-4xl font-bold">0</div>
  <button id="btn" onclick="jump()" class="absolute bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 bg-blue-600 text-white cursor-pointer hover:bg-blue-500 active:scale-95">JUMP</button>
  <div id="msg" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-2xl">PRESS JUMP TO START</div>
</div>
<script>let y=0,vy=0,x=0,score=0,running=false,speed=4,jumping=false;const player=document.getElementById('player'),obs=document.getElementById('obs'),scoreEl=document.getElementById('score'),msg=document.getElementById('msg'),game=document.getElementById('game');window.jump=function(){if(!running){running=true;x=0;score=0;speed=4+Math.random()*3;msg.textContent='';loop();return;}if(!jumping){jumping=true;vy=16;}};function loop(){if(jumping){vy-=0.8;y+=vy;if(y<=0){y=0;vy=0;jumping=false;}}player.style.bottom=(64+y)+'px';x+=speed;const w=game.offsetWidth;if(x>w+40){x=0;score++;scoreEl.textContent=score;speed=4+Math.random()*3;}obs.style.right=x+'px';const obsLeft=w-x;const px=64,py=64+y,pw=48,ph=48;const ox=obsLeft,oy=64,ow=40,oh=80;if(px<ox+ow&&px+pw>ox&&py<oy+oh&&py+ph>oy){running=false;msg.textContent='GAME OVER - SCORE: '+score;return;}requestAnimationFrame(loop);}</script>


### Source
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
```


# Custom Syntax
🌊big

# Syntax Overview
| Syntax | Description |
|--------|-------------|
| `.class` | Add class to scope |
| `$var: value` | Override CSS variable |
| `text~fr` | Footer right text |
| `text~fl` | Footer left text |
| `![](path)~bg` | Slide background |
| `![](path)~fbg` | Footer background |
| `![](path)~icon` | Icon (me template) |
| `[alt](url)~card` | OGP link card |
| `🌊template` | Set template |
| `---` / `---` | Frontmatter (YAML) |

# Templates & Classes
| Template  | Description |
|-----------|-------------|
| `default` | Heading + body |
| `title`   | Title slide |
| `note`    | Centered body + subtitle |
| `me`      | Profile / intro |
| `big`     | Large centered text |
| `small`   | Small centered text |

| Class     | Description |
|-----------|-------------|
| `.row`    | Horizontal section layout |

# Default
Heading + body text

````md
# Default
Heading + body text
```md
...
```
````

# Note
🌊note
## Body centered + subtitle below
````md
# Note
🌊note
## Body centered + subtitle below
````

# Me
🌊me
![icon](/henohe-Nun/images/icon.png)~icon

Profile template
- Icon on the left
- Body on the right

````md
# Name
🌊me
![icon](/path/to/icon.png)~icon

Bio text
````

# Title
Title slide.
`fbg` doubles as `bg`.

````md
---
date: 2025/02/07
---
![](/henohe-Nun.png)~fbg
...
🌊title
# Title
## Subtitle
````

# Title Sample
🌊title
## Subtitle

# Big
Large centered text

```md
# Big Text
🌊big
```

# Big Sample
🌊big

# Small
Small centered text

```md
# Small Text
🌊small
```

# Small Sample
🌊small

# Footer & Background
.row
## Footer
`text~fr` → footer right, `text~fl` → footer left.
## Background
`![](path)~bg` → slide background.
`![](path)~fbg` → footer background.
Options: `![](path)~bg.blur-sm.opacity-50`

# CSS Variables
| Variable        | Default               | Description           |
|-----------------|-----------------------|-----------------------|
| `--base`        | `#ffffff`             | Background            |
| `--main`        | `#1a1a1a`             | Primary text          |
| `--sub`         | `#888888`             | Muted text            |
| `--strong`      | `#000000`             | High-contrast chrome  |
| `--brand`       | `#5932ff`             | Accent color          |
| `--code-accent` | `#d6336c`             | Inline code highlight |
| `--font-body`   | IBM Plex Sans JP, ... | Body font             |
| `--font-mono`   | Consolas, ...         | Mono font             |


# FIN. 🎉
🌊small
