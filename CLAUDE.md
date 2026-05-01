# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nun is a Markdown-to-slide presentation tool. Markdown files in `benben/` (including subdirectories) are converted to HTML slides via a unified pipeline, served by Vite.

**Current state**: Pre-implementation (regenerate branch). Only specs and docs exist — no source code yet.

## Language

Communicate in Japanese. The user prefers Japanese for all discussion.

## Specs (read these before implementing)

- `docs/spec/syntax.md` — Markdown syntax + custom extensions (templates, nwyt, admonitions, code blocks, footnotes)
- `docs/spec/structure.md` — Heading-to-DOM mapping, template list, theme, footer
- `docs/spec/requirements.md` — Navigation, output formats, OGP, HMR
- `docs/spec/technical.md` — Pipeline design, Scope structure, micromark extensions, template application, Vite plugin (the **primary implementation reference**)
- `docs/comparison.md` — Competitor comparison, tech stack selection rationale

## Architecture

```
md → micromark+extensions → mdast → remark plugins → hast(flat)
  → rehype plugins → Scope extraction → template application → fn resolution
  → page shell → rehype-stringify → HTML
```

### Key concepts

- **Scope**: Intermediate data structure between flat hast and structured output. Headings define scope boundaries (h1=section, h2+=article). Templates are functions `Scope → Element`.
- **vfile.data**: Templates and nwyt props are extracted from mdast, stored with position info in vfile.data, then matched to Scopes by line range during extraction.
- **Global scope**: Entries before first h1 are defaults. Template names are ignored globally; classes and nwyt props inherit to all scopes.

### Custom syntax (micromark extensions)

- `🌊template.class` — Template + class assignment (flow level)
- `!key~value` — Nwyt prop, consumed as scope metadata (flow level)
- `!key[value](url)` — Nwyt content, stays in output (text level)
- `:::type` — Admonition blocks (flow level)

### Vite plugin

- **Dev**: Middleware intercepts requests → pipeline.process → server.transformIndexHtml
- **Build**: config (rollupOptions.input) + resolveId + load → Vite resolves CSS/JS paths
- Both use source paths (`/src/styles/index.css`, `/src/client/index.ts`); Vite handles resolution

## Naming Conventions

- **Article** (not Section) for h2+ scopes: `Article`, `RawArticle`, `ResolvedArticle`
- **Nwyt** (not tilde) for `!key` syntax: nwyt prop (`!key~value`), nwyt content (`!key[value]`)
- Egyptian mythology naming theme: "Nun" (primordial waters), "nwyt" (water swell)

## Commands

```bash
bun install          # 依存インストール
bun run dev          # 開発サーバー
bun run build        # ビルド
```

## Tech Stack

- **bun** (パッケージマネージャ + ランタイム)
- Vite (build + HMR)
- unified (micromark → mdast → hast → Scope → hast → stringify)
- hastscript `h()` for templates (not JSX)
- UnoCSS + CSS variables
- vanilla TS (client: navigation, zoom-fit, tooltip, copy)
- Playwright + mutool (PDF/WebP output, separate command)

## Development Principles

- Consistency over cleverness — same concept = same implementation pattern
- Minimal changes — no "while I'm here" refactoring
- `h()` over JSX — unified world consistency, templates are code not markup
- micromark extension over remark plugin — prevents collisions with `~` (strikethrough) and `[` (link references)
- All embed rendering is SSR (no client-side rendering)
