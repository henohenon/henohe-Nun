# henohe-Nun

Markdown slides tool. `benben/*.md` -> HTML slide decks.
Deployed to GitHub Pages at `https://henohenon.github.io/henohe-Nun/`.

## Commands

```bash
bun run dev            # Vite dev server (Hono via @hono/vite-dev-server)
bun run build          # Vite SSG build -> dist/
bun run preview        # Preview built site
bun run lint           # Biome check (lint + format)
bun run lint:fix       # Biome auto-fix
bun run typecheck      # tsc --noEmit for src + scripts
```

Export scripts run via **tsx (Node)**, NOT Bun (Playwright requires Node):

```bash
bun run build:pdf <deck>                # PDF via Playwright + Ghostscript
bun run build:png <deck> [start] [end]  # Per-slide PNG screenshots
bun run build:webp <deck>               # OGP thumbnail (sharp, 1200x630)
bun run build:thumbs                    # Thumbnails -> public/thumbs/
SKIP_BUILD=1 bun run build:png <deck>   # Skip Vite rebuild
```

## Verify your work

IMPORTANT: After code changes, always run:

```bash
bun run typecheck && bun run lint
```

For visual changes, `bun run dev` and check the browser. No test suite exists; typechecking + lint is the primary gate.

## Architecture

```
vite.config.ts             Vite + UnoCSS + Hono dev server + SSG plugin
src/app.ts                 Hono app factory (dev entry + SSG source)
src/ssg.ts                 Vite plugin: generateBundle -> static HTML via Hono
src/parser/                MD -> structured Deck data (pure logic, no HTML)
  syntax.ts                Shared regex patterns for the 5 syntax types
  pipeline/split.ts        Stage 1: frontmatter + H1 split + root .class/$var
  pipeline/meta.ts         Stage 2: per-slide meta + H2 sections + ~tilde extraction
  pipeline/render.ts       Stage 3: marked rendering per section
  index.ts                 Orchestrator: split -> meta -> OGP batch -> render -> Deck
  markdown/                marked config, fence tracker, extensions (spacer, link-card)
  types.ts                 Deck / Slide / Section types
  ogp-fetch.ts             Batch OGP fetcher for ~card URLs
src/render/                Deck data -> HTML via Hono JSX
  pages/deck.tsx           Deck page: parser + template dispatch + shell
  pages/index.tsx          Top page: deck listing
  components/templates.tsx Template functions (default, title/hero, me, big, small, note, row)
  components/parts.tsx     Shared slide parts (bg layer, footer, sections wrapper)
  components/code-block.tsx  highlight.js code rendering
  components/link-card.tsx OGP link card HTML
  components/head.tsx      <head> meta tags + OGP
  decks.ts                 Deck file enumeration (listDecks, readDeckMd)
  types.ts                 PageOptions
src/client/                Browser JS (loaded per-page)
  deck/index.ts            Deck page entry: navigation + zoom-fit + cursor-dot + CSS
  index.ts                 Top page entry
scripts/                   Export scripts (Playwright + sharp + Ghostscript)
  _lib.ts                  Shared: Vite build, HTTP server, Chromium CDP, deck listing
benben/                    Deck markdown sources (*.md)
```

### Data flow

```
benben/*.md                               User-authored markdown
  -> src/parser/ (parseDeck)              Pure data: Deck { slides, frontmatter }
  -> src/render/pages/deck.tsx            HTML via Hono JSX templates
  -> src/app.ts (Hono route handler)      Served in dev / emitted in SSG
  -> src/client/deck/ (browser)           Navigation, zoom, interactions
```

The parser produces a `Deck` object with **no HTML** — only structured data.
The render layer turns it into HTML via Hono JSX. This separation is intentional.

## Deck syntax reference

`design.md` is the authoritative spec. Quick reference below.

5 syntax types only. NEVER add a 6th:

```markdown
---                        # Frontmatter (YAML, deck-level metadata)
date: 2026/04/10
---

.dark.p-8                  # .class (scope: root/slide/section)
$accent: #ff0000           # $var: value (CSS variable override)
text~fr                    # value~key (tilde: fr, fl, bg, fbg, card)
![](/img.png)~bg.blur-sm   # tilde with options (UnoCSS classes chained with .)
[alt](url)~card            # link card
template-declaration       # template declaration (emoji prefix)

# Slide Title              # H1 = slide boundary
## Section                 # H2 = section boundary
```

### Scope rules

```
Root (before first #)    .class $var value~fr/fl  -> applied to entire deck
# Slide                  .class $var template     -> applied to this slide
## Section               .class $var              -> applied to this section
```

Declarations (`.class`, `$var`, template) must appear at the TOP of their scope, before any content. After content starts, they become regular markdown.

### Tilde keys

| Key | Purpose | Value |
|-----|---------|-------|
| `~bg` | Slide background image | Image path or `![](path)` |
| `~fbg` | Footer background | Same |
| `~fr` | Footer right text | Plain text |
| `~fl` | Footer left text | Plain text |
| `~card` | OGP link card | `[alt](url)` |

Options after the key (`.blur-sm.opacity-30`) are UnoCSS utility classes.

## Design decisions

IMPORTANT: Read `design.md` before any structural changes. It is the source of truth.

Key constraints:
- MD extensions are minimal by design — complex layout uses raw HTML + UnoCSS
- CSS Container Query Units (`cqw`/`cqh`/`cqmin`) for size-independent rendering
- `container-type: size` on `.slide` elements
- Themes are CSS-only; templates are TS/JSX functions that return HTML structure
- Templates are shortcuts for section layout + class combinations, NOT content transformers

## Boundaries

### Always

- Run `bun run typecheck && bun run lint` after changes
- Read `design.md` before structural or syntax changes
- Guard parser code against fenced code blocks (use `taggedLines()`)
- Use Hono JSX (`import type { FC } from 'hono/jsx'`), NOT React

### Ask first

- Changing the parser pipeline structure (split -> meta -> render)
- Adding or removing dependencies in package.json
- Modifying the Vite plugin or SSG build process
- Changes to the tilde key vocabulary

### Never

- Adding a 6th syntax type (the 5 types are a hard design constraint)
- Using `await` with `marked.parse()` (it's synchronous in this codebase)
- Parsing syntax inside fenced code blocks
- Using React APIs (this is Hono JSX, not React)
- Using `require()` (ESM only)
- Running export scripts with Bun (must use tsx/Node for Playwright compat)

## Gotchas

- `TILDE_RE` is greedy on `~` — a line like `a~b~c` matches `a~b` as value + `c` as key. The last `~` wins.
- `taggedLines()` from `fence.ts` is the ONLY correct way to iterate lines in parser stages. Raw line iteration will break on fenced code blocks.
- `marked` is configured synchronous. `marked.parse()` returns `string`, not `Promise`. The code throws if a Promise is returned.
- OGP fetching is batched at the deck level (`parseDeck` in `index.ts`), not per-section. Card URLs are collected from all slides first, then fetched in one batch.
- Dev server uses `@hono/vite-dev-server` which imports `src/app.ts` directly. SSG reuses the same `createApp()` factory with different asset options.
- `index.html` exists only as a Vite entry point for client JS bundling. All actual HTML is generated by Hono.
- Templates in `components/templates.tsx` receive a `Slide` object and return JSX. They are dispatched by name in `deck.tsx`.
- UnoCSS runs as a Vite plugin — classes in the generated HTML are picked up automatically.
