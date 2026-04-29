# henohe-Nun

Markdown slide deck tool. `benben/*.md` -> HTML slide decks.

## Commands

```bash
bun run dev              # Vite dev server
bun run build            # SSG build -> dist/
bun run typecheck        # tsc --noEmit
bun run lint             # Biome check
bun run lint:fix         # Biome auto-fix
```

## Verification

IMPORTANT: After ANY code change, always run:

```bash
bun run typecheck && bun run lint
```

No test suite exists. Typecheck + lint is the only automated gate.
For visual changes: run `bun run dev` and check the browser.

## How to approach tasks

### 1. Understand before acting

Before writing any code, read what already exists.

- Read the files you intend to change AND their callers/callees.
- Read `design.md` before any structural or syntax change. It is the authoritative spec.
- Read the relevant `.claude/rules/` files for domain-specific constraints.
- Read `types.ts` and function signatures first — understand the data shape before the implementation.

If multiple interpretations of a request exist, ask which one is intended. Do not guess silently.

### 2. Plan multi-step changes

For changes that touch more than 2-3 files or cross layer boundaries:

1. State which files will be affected and why.
2. Identify the order of changes (types first, then implementation, then callers).
3. Call out risks — what could break, what assumptions are being made.

Skip planning for trivial changes (typo, rename, single-line fix).

### 3. Make surgical changes

Every changed line should trace directly back to the request.

- Do not "improve" adjacent code, comments, formatting, or type annotations.
- Do not add docstrings, error handling, or validation beyond what was asked.
- Do not refactor things that are not broken.
- Match existing code style, even if you would do it differently.
- If your changes make something unused (imports, variables, functions), remove those orphans. But do not remove pre-existing dead code unless asked.

### 4. Verify the result

After implementation, define what "done" looks like:

- Types compile: `bun run typecheck`
- Lint passes: `bun run lint`
- For visual changes: describe what to check in the browser
- For parser changes: trace a sample input through the pipeline mentally

If something fails, diagnose the root cause. Do not retry the same approach or add workarounds to silence errors.

## Code quality principles

### Simplicity first

Write the minimum code that solves the problem.

- No features beyond what was asked.
- No abstractions for single-use code. Three similar lines is better than a premature helper.
- No "flexibility" or "configurability" that was not requested.
- No error handling for scenarios that cannot happen. Trust internal code. Only validate at system boundaries (user input, external APIs).
- If the implementation feels overcomplicated, it probably is. Rewrite it simpler.

### Consistency over cleverness

This project values uniform patterns over locally optimal solutions.

- When the same concept exists at multiple levels (e.g., slide-level and article-level), use the same implementation pattern for both. Do not let them diverge.
- When introducing a new pattern, update existing similar code to match. Inconsistency is technical debt.
- Follow existing naming conventions. Read surrounding code to learn them.
- When you see a shared abstraction (like `renderBody()` serving both levels), maintain that sharing. Do not create parallel implementations.

### Type-driven development

- Read type definitions before implementations — they describe the contract.
- Maintain the property that "if it compiles, it's probably correct."
- Avoid `any`, type assertions (`as`), and non-null assertions (`!`). Type errors usually signal a design problem, not a type system limitation.
- When adding a new field or concept, propagate it through the full type chain (e.g., `RawArticle` -> `ResolvedArticle` -> `Article` -> render component props).

### Structural awareness

This project intentionally separates concerns into layers:

```
parser (pure data, no HTML) -> render (Hono JSX -> HTML string) -> client (browser DOM)
```

- **Parser**: Produces structured data only. No HTML generation, no side effects.
- **Render**: Hono JSX components. NOT React — no hooks, no `useState`, no `className`. Use `class`.
- **Client**: Vanilla TypeScript + DOM APIs. No framework.

Changes that cross layer boundaries require extra care. Verify that the separation is maintained: parser should not know about HTML structure, render should not parse markdown, client should not duplicate server logic.

## Hard constraints

These are non-negotiable. Violating them introduces bugs or breaks design invariants.

| Constraint | Why |
|---|---|
| 5 syntax types only (`.class`, `$var`, `value~key`, template, frontmatter) | Design decision. Complex layout uses raw HTML + UnoCSS instead. See `design.md`. |
| Parser line loops must use `taggedLines()` from `fence.ts` | Raw iteration parses syntax inside fenced code blocks, causing silent bugs. |
| Hono JSX, not React | `import type { FC } from 'hono/jsx'`. No hooks, no `className`, no React APIs. |
| ESM only | No `require()`. The entire codebase is ESM. |
| `marked.parse()` is synchronous | Returns `string`, not `Promise`. Never `await` it. Code throws if async. |
| All regex patterns in `syntax.ts` | Line-matching regex must not be defined ad-hoc in pipeline stages. |
| Export scripts use tsx/Node | Never Bun. Playwright requires Node runtime. |

## Gate checks before changing

Ask before modifying:

- Parser pipeline structure (build -> nwyt -> render)
- Nwyt key vocabulary (~bg, ~fr, ~fl, ~fbg, ~icon, ~caption, ~card)
- Dependencies in `package.json`
- Vite plugin or SSG build process (`ssg.ts`, `vite.config.ts`)
- The 5 syntax types or their semantics

## Communication

- Communicate in Japanese.
- When the intent of a request is ambiguous, ask before implementing.
- For visual changes, prompt to check the browser with `bun run dev`.
- When you find an issue unrelated to the current task, mention it but do not fix it unless asked.
