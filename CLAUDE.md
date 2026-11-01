# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nun is a personal slide repository built on pure Marp (marp-cli + a custom theme + `--html`). Markdown decks in `benben/*.md` are converted by marp-cli into HTML / PDF and published to GitHub Pages (`https://henohenon.github.io/henohe-Nun/`) by GitHub Actions. Named after the Egyptian god of primordial waters.

The old implementation (a custom Vite + unified pipeline with heading-hierarchy templates and the nwyt syntax) was retired in the Marp migration. Its specs are in `docs/archive/` and its code is at tag `nun-v1`. Do not reintroduce its patterns.

## Language

Communicate with the user in Japanese. All discussion, commit messages, and comments should be in Japanese unless otherwise specified.

## Specs

Read the relevant spec before changing anything. The spec is the source of truth.

- `docs/superpowers/specs/2026-10-03-marp-migration-design.md` — current design: directory layout, commands, syntax rules, theme, risks
- `docs/journal-2026-09-29-marp.md` — why Nun moved to Marp
- `docs/comparison.md` — competitor analysis (partly superseded by the journal above)

## Architecture

```
benben/*.md --marp -I benben -o dist--> dist/<deck>.html
benben/images/, public/ --scripts/postbuild.ts--> dist/  (+ redirect pages for old /<deck>/ URLs)
push to main --.github/workflows/deploy.yml (build + pdf)--> GitHub Pages
```

- `marp.config.ts` — shared marp-cli options (typed with `defineConfig`; marp-cli transpiles it with the local TypeScript, which must stay <= v6) (`html`, `themeSet`, `allowLocalFiles`); dev / build / pdf all read it
- `themes/nun.css` — the only theme (`@theme nun`), fixed 1280×720
- `public/index.html` — hand-written deck list (links to `<deck>.html` and `<deck>.pdf`)
- `scripts/postbuild.ts` — copies `benben/images` and `public/` into `dist/`, writes `dist/<deck>/index.html` redirect pages (keeps `#N`)
- `.github/workflows/deploy.yml` — PRs only build; pushes to main build and deploy
- The site lives under `/henohe-Nun/`, so every link and asset path must be relative
- `scripts/deck/` — logo SVG generators (output is a starting point; deck SVGs were hand-adjusted afterwards)

## Writing Decks

- Marp standard syntax only. No custom engine, markdown-it plugins, or syntax sugar. If something feels missing, ask before extending
- front-matter: `theme: nun`; `header:` is drawn bottom-right, `footer:` bottom-left
- Slide classes: `title` (with `![henoheno](images/henoheno.svg)`), `solo`, `message` (`<p class="lead">` at the end)
- Images use relative paths (`images/...`), never `/images/...` (absolute paths break PDF conversion)
- SVGs with links or nested images go in `benben/images/<deck>/` and are referenced with `<object data="images/<deck>/<name>.svg" type="image/svg+xml"></object>`. SVGs inside `<object>` cannot use page CSS variables
- Overflowing slides: `<style scoped>section { font-size: 28px; }</style>` (headings are em-based and shrink with it)
- Non-directive HTML comments become presenter notes
- After adding a deck, add a line to `public/index.html`
- `benben/private/` is gitignored and must never be committed (the repo is public)

## Commands

```bash
bun install          # Install dependencies
bun run dev          # marp -s benben (server mode, http://localhost:8080)
bun run build        # dist/<deck>.html + static files
bun run pdf          # dist/<deck>.pdf
```

`bun run dev` を起動したら、作業終了時に必ず停止する (port 滞積防止)。

## Tech Stack

- **bun** — package manager and runtime
- **@marp-team/marp-cli** — conversion, dev server, presenter features
- **tsx** — scripts
- **GitHub Actions + GitHub Pages** — hosting

## Development Philosophy

### Think Before You Code

Read the spec before touching anything. If the spec doesn't cover a case, ask — don't guess. When the spec and the code disagree, the spec wins until explicitly changed.

### Minimal, Intentional Changes

Do exactly what was asked. Don't refactor neighboring code. Don't introduce abstractions for hypothetical future needs.

### Stay Green

Every commit should leave `bun run build` working.

### Ask When Uncertain

When something is ambiguous or under-specified, stop and ask. A question costs seconds; a wrong assumption costs a rewrite.
