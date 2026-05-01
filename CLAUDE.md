# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nun is a Markdown-to-slide presentation tool built on Vite + unified. Markdown files in `benben/**/*.md` are transformed through a unified pipeline into HTML slide decks. Named after the Egyptian god of primordial waters.

**Current state**: Pre-implementation (regenerate branch). Specs are complete; source code implementation is in progress following `docs/dev-plan.md`.

## Language

Communicate with the user in Japanese. All discussion, commit messages, and comments should be in Japanese unless otherwise specified.

## Specs

Read the relevant spec before implementing any feature. The spec is the source of truth.

- `docs/spec/syntax.md` — Markdown syntax and custom extensions (templates, nwyt, admonitions, code blocks, footnotes)
- `docs/spec/structure.md` — Heading-to-DOM mapping, template catalog, theme system, footer
- `docs/spec/requirements.md` — Navigation, output formats, OGP, HMR
- `docs/spec/technical.md` — Pipeline design, Scope structure, micromark extensions, template application, Vite plugin (**primary implementation reference**)
- `docs/comparison.md` — Competitor analysis and tech stack rationale

## Architecture

```
md -> micromark+extensions -> mdast -> remark plugins -> hast (flat)
   -> rehype plugins -> Scope extraction -> template application -> fn resolution
   -> page shell -> rehype-stringify -> HTML
```

### Core Concepts

- **Scope**: Intermediate structure between flat hast and structured output. h1 creates sections, h2+ creates articles within sections. Templates are functions `(Scope) -> Element`.
- **vfile.data**: Templates and nwyt props are extracted from mdast with position info, stored in vfile.data, then matched to Scopes by line range during extraction.
- **Global scope**: Content before the first h1 provides defaults. Template names are ignored globally; only classes and nwyt props inherit to all scopes.

### Custom Syntax (micromark extensions)

| Syntax | Level | Purpose |
|--------|-------|---------|
| `🌊template.class` | flow | Template + class assignment |
| `!key~value` | flow | Nwyt prop (consumed as scope metadata) |
| `!key[value](url)` | text | Nwyt content (stays in output) |
| `:::type` | flow | Admonition blocks |

### Vite Plugin

- **Dev**: Middleware intercepts requests -> pipeline.process -> server.transformIndexHtml
- **Build**: config (rollupOptions.input) + resolveId + load -> Vite resolves CSS/JS paths
- Both modes use source paths (`/src/styles/index.css`, `/src/client/index.ts`); Vite handles resolution and bundling

## Naming Conventions

- **Article** (not Section) for h2+ scopes: `Article`, `RawArticle`, `ResolvedArticle`
- **Nwyt** (not tilde) for the `!key` syntax family
- Egyptian mythology naming theme: "Nun" (primordial waters), "nwyt" (water swell)

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Dev server with HMR
bun run build        # Production build
```

## Tech Stack

- **bun** — package manager and runtime
- **Vite** — build tooling and HMR
- **unified** — micromark -> mdast -> hast -> Scope -> hast -> stringify
- **hastscript** `h()` — template rendering (not JSX)
- **UnoCSS** + CSS variables — styling
- **vanilla TS** — client scripts (navigation, zoom-fit, tooltip, copy)
- **Playwright + mutool** — PDF/WebP output (separate command)

## Development Philosophy

### Think Before You Code

Read the spec for any feature before touching code. If the spec doesn't cover a case, ask — don't guess. When the spec and the code disagree, the spec wins until explicitly changed.

### Consistency Over Cleverness

Use the same pattern for the same concept everywhere. If the codebase uses `h()` for element construction, don't introduce JSX. If types use `Article`, don't call it `Section`. Predictability matters more than elegance.

### Minimal, Intentional Changes

Do exactly what was asked. Don't add docstrings to unchanged functions. Don't refactor neighboring code. Don't introduce abstractions for hypothetical future needs. Three similar lines are better than a premature helper function.

### Build Incrementally, Stay Green

Follow `docs/dev-plan.md` phases in order. Each phase should end with something that builds and runs. Never leave the project in a broken state between commits.

### Clean Slate, No Legacy Baggage

This is a ground-up rewrite. Don't carry over patterns from the old implementation. Every design decision should be justified by current requirements, not historical accident.

### Precision Over Brevity

Don't sacrifice correctness to save tokens or lines of code. If a type needs five fields, give it five fields. If an error case exists, handle it. But don't handle error cases that can't happen.

### Ask When Uncertain

When something is ambiguous or under-specified, stop and ask. A question costs seconds; a wrong assumption costs a rewrite.
