# Nun CSS Design Guide

Consult this document before writing any CSS.
Every decision here has a rationale, a scope, and a list of prohibitions. Don't write from memory.

---

## 1. Design Philosophy

### 1.1 CUBE CSS — Work With the Cascade

The methodology is **CUBE CSS** (Andy Bell, https://cube.fyi/).

> "It's not a reinvention of CSS, it's an amplification."

The four layers:

| Layer | Meaning | Nun example |
|-------|---------|-------------|
| **C**omposition | Skeleton layout for pages and regions | section grid structure, templates |
| **U**tility | Single-purpose helper classes | `.dark`, `.v` (vertical) |
| **B**lock | Self-contained components | `.admonition`, `.card`, `figure.code-block` |
| **E**xception | Context-specific overrides | `.admonition.warning`, `section[data-theme="dark"]` |

The cascade and inheritance are features, not bugs. Work with them. Don't fight them.
`!important` is a last resort. Avoid designs that endlessly escalate specificity.

### 1.2 Grid-First

**Structure layouts with Grid. Use Flex only for single-axis alignment inside components.**

Grid controls 2D (rows and columns simultaneously). Flex controls 1D (one axis only).
For a slide deck where the goal is to divide the canvas into named regions, Grid expresses intent precisely.

```css
/* Good: section structure uses Grid */
section {
  display: grid;
  grid-template-rows: auto 1fr auto; /* heading / body / footer */
}

/* Good: single-axis alignment uses Flex */
.card-url {
  display: flex;
  align-items: center;
  gap: 0.3em;
}

/* Bad: don't express 2D structure with Flex */
section { display: flex; flex-direction: column; }
```

Reference: Rachel Andrew, "Best Practices With CSS Grid Layout" (Smashing Magazine)

### 1.3 Design Token-Driven

**Never hardcode magic numbers. Name every value as a token.**

Tokens use a **Primitive → Semantic** two-layer system (the Component layer is omitted at Nun's scope).

```
Primitive:  --raw-blue-500: #5932ff        ← kept as a comment in theme.css
Semantic:   --brand: var(--raw-blue-500)   ← the token you actually use
```

Hardcoded values destroy intent. `--sub` means "secondary text color". `#888888` means nothing.

### 1.4 Container-Relative Scale

**Base sizing on containers, not the viewport.**

`vw/vh` behave unexpectedly in print, embeds, and iframes.
`cqmin` is "1% of the container's smaller dimension," so slides stay proportional when the aspect ratio changes.

```css
font-size: clamp(14px, 5cqmin, 100px);
/* min: 14px | scales with container at 5% | max: 100px */
```

Reference: Ahmad Shadeed, "An Interactive Guide to CSS Container Queries" (ishadeed.com)

---

## 2. File Structure and Responsibilities

```
src/styles/
├── theme.css          # Token definitions only (no selector styles)
├── base.css           # Reset, html/body/section structure, inline elements
├── footer.css         # section > footer SVG footer
├── code-block.css     # figure.code-block, inline code
├── admonition.css     # .admonition and its children
├── footnote.css       # sup[data-fn], .fn-tooltip
├── card.css           # a.card link cards
└── templates/
    ├── default.css    # default template + shared .body content styles
    ├── title.css      # title template
    ├── me.css         # me template
    ├── message.css    # message template
    └── solo.css       # solo template
```

**Responsibility rules:**

- `theme.css` defines tokens only. No visual styles.
- `base.css` handles reset and structure only. No component-specific styles.
- Template files scope to their own template (`section.TMPL > *`) only.
- Component files scope to their component root and below only.

---

## 3. Design Tokens

### 3.1 Color Tokens (Semantic layer)

| Token | Role |
|-------|------|
| `--base` | Background color |
| `--main` | Primary text |
| `--sub` | Secondary text (captions, metadata) |
| `--strong` | Emphasis (headings, rules) |
| `--brand` | Brand accent (links, heading color) |
| `--muted` | Subtle background (code blocks, admonitions) |
| `--fg-mid` | Midpoint between `--main` and `--sub` |
| `--border` | Rules and outlines |
| `--overlay` | Semi-transparent hover/active layer |
| `--shadow` | Box shadows |

**Generate derived tokens with `color-mix()`:**

```css
--muted:   color-mix(in srgb, var(--base) 94%, var(--main));
--fg-mid:  color-mix(in srgb, var(--main) 50%, var(--sub));
--border:  color-mix(in srgb, var(--base) 70%, var(--sub));
```

Why `color-mix()`: when `--base`/`--main` flip for dark mode, derived colors follow automatically.

**Don't hardcode colors inside components:**

```css
/* Bad */
.admonition { background: color-mix(in srgb, #fff 94%, #1a1a1a); }

/* Good */
.admonition { background: var(--muted); }
```

### 3.2 Scale Tokens (section scope)

Defined on `section` and scaled proportionally using `cqmin` + `clamp()`.

```css
section {
  --text-body:        clamp(14px, 5cqmin,   100px);
  --slide-title-size: clamp(20px, 9.1cqmin, 180px);
  --slide-pad-x:      clamp(16px, 8cqmin,   180px);
  /* ... */
}
```

**How to determine the multiplier:**
At the reference size (1280×720px), `cqmin = 720px`.
`5cqmin` → `720 × 0.05 = 36px`. Check whether that value feels right; adjust the multiplier.

**The three arguments of `clamp()`:**

```css
clamp(MIN, PREFERRED, MAX)
/* MIN: absolute floor (px) */
/* PREFERRED: proportion of the container (cqmin) */
/* MAX: absolute ceiling (px) */
```

### 3.3 Typography Tokens

| Token | Value |
|-------|-------|
| `--font-body` | `"IBM Plex Sans JP"`, system fallbacks |
| `--font-mono` | `"Consolas"`, `"Monaco"`, `"Menlo"`, monospace |

Font sizes are specified via scale tokens. Never write `font-size: 16px` directly.

---

## 4. Layout System

### 4.1 Slide (section) Grid Structure

```css
section {
  display: grid;
  grid-template-rows: auto 1fr auto;
  /* heading(auto) / body(1fr) / footer(auto) */
}
```

- `auto`: sized by content (heading, footer)
- `1fr`: takes all remaining space (body)
- If a slide has no heading, the `auto` track collapses to 0 — the grid stays intact.

This eliminates the need for `flex-shrink: 0` hacks. The `auto` track in Grid does the same job.

### 4.2 Named Grid Areas

For templates with multiple regions, use `grid-template-areas` to make intent explicit:

```css
section.me {
  display: grid;
  grid-template-areas:
    "heading heading"
    "icon    body  "
    "footer  footer";
  grid-template-columns: clamp(60px, 20cqmin, 360px) 1fr;
  grid-template-rows: auto 1fr auto;
}

section.me > h1     { grid-area: heading; }
section.me > .icon  { grid-area: icon; }
section.me > .body  { grid-area: body; }
section.me > footer { grid-area: footer; }
```

The layout structure is legible without reading the selectors.

### 4.3 The `fr` Unit

- `fr` represents a fraction of the available space
- After inflexible items (`auto`, `px`) are placed, the remaining space is divided into fractions
- More flexible than percentages (percentages calculate against space including padding)

```css
/* 1/3 + 2/3 two-column layout */
grid-template-columns: 1fr 2fr;

/* Equal columns that don't overflow their content */
grid-template-columns: repeat(3, minmax(0, 1fr));
/* minmax(0, 1fr): sets min-content to 0 so content doesn't overflow */
```

### 4.4 When Flex Is Acceptable

Use Flex only when all three conditions are true:

1. **Single axis only** (row or column, not both)
2. **Size is content-driven, not even fractions**
3. **Switching to Grid would reduce readability**

```css
/* OK: icon + text side by side */
.card-url { display: flex; align-items: center; gap: 0.3em; }

/* OK: wrapping tag list */
.tag-list { display: flex; flex-wrap: wrap; gap: 0.4em; }

/* Not OK: section structure (write it in Grid) */
section { display: flex; flex-direction: column; }
```

### 4.5 Footer Placement

Place the footer in the final `auto` row of the section's Grid. **Do not use `position: absolute`.**

```css
section {
  display: grid;
  grid-template-rows: auto 1fr auto;
  /* footer naturally settles into the last row */
}
```

Benefits:
- No `padding-bottom` needed on `.body` to avoid overlap
- Body and footer never overlap
- No stacking context issues from `position: absolute`

---

## 5. Every Layout Primitives

Algorithmic CSS patterns from Every Layout (Andy Bell & Heydon Pickering, https://every-layout.dev/).
These create responsive layouts without media queries.

Nun applies these primitives to body content:

### Stack (vertical spacing)

```css
/* Vertical spacing for body content */
.stack > * + * {
  margin-block-start: var(--stack-space, 0.4em);
}
```

`> * + *` (lobotomized owl): only adjacent siblings receive a top margin.
No extra margin on the first or last child.

### Cluster (horizontal, wrapping)

```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cluster-space, 0.5em);
}
```

For tags, button groups, inline icons — anything that lines up horizontally and wraps.

### Box (self-contained container)

```css
.box {
  padding: var(--box-padding, 0.75em);
  border: 1px solid var(--border);
  background: var(--muted);
}
```

The base form for anything that needs to be "boxed in" (admonitions, cards, code blocks).

---

## 6. Container Queries

### 6.1 Declaring Containers

```css
/* size: tracks both width and height (higher computation cost) */
.slides    { container-type: size; }  /* baseline for cqmin */
section    { container-type: size; }

/* inline-size: tracks width only (recommended for most components) */
.card-wrapper { container-type: inline-size; }
```

### 6.2 Container Query Units

| Unit | Meaning |
|------|---------|
| `cqw` | 1% of the container's width |
| `cqh` | 1% of the container's height |
| `cqi` | 1% of the container's inline size |
| `cqb` | 1% of the container's block size |
| `cqmin` | 1% of the smaller of inline and block |
| `cqmax` | 1% of the larger of inline and block |

Nun slides use `cqmin` to maintain proportions regardless of aspect ratio.

### 6.3 Caveats

- A container **cannot query itself**. Queries only apply to descendant elements.
- Without a `container-type: size` ancestor, `cqmin` resolves to `0`.
- `container-type` creates a new stacking context (may affect `z-index` behavior).

---

## 7. Theming and Dark Mode

### 7.1 Theme Switching via Token Replacement

Dark mode is implemented by overriding tokens with a `.dark` class or `[data-theme="dark"]`.
Components never contain `@media (prefers-color-scheme: dark)` — slides use explicit theme controls.

```css
/* Dark on a single section */
section.dark { --base: #0f0f10; --main: #e6e6e6; /* ... */ }

/* Dark for the whole deck */
:root[data-theme="dark"] { --base: #0f0f10; /* ... */ }
```

### 7.2 Dark Mode Checklist

- `--muted`, `--border`, `--overlay` are derived via `color-mix()` and adapt automatically.
- Admonition type colors (e.g., `#4b70ff`) are hardcoded — verify contrast on both light and dark.
- For images and icons, consider `filter: brightness()` or `opacity` adjustments.

---

## 8. Reset Strategy

Based on Andy Bell's "A More Modern CSS Reset" (https://piccalil.li/blog/a-more-modern-css-reset/).
**Modern browsers already agree on most defaults — keep the reset minimal.**

Items to add to `base.css`:

```css
/* Prevent font size inflation on mobile */
html {
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}

/* Improve heading text wrapping (progressive enhancement) */
h1, h2, h3, h4 {
  text-wrap: balance;
}

/* Form elements inherit the document font */
input, button, textarea, select {
  font-family: inherit;
  font-size: inherit;
}
```

`text-wrap: balance`: distributes words evenly across lines for multi-line headings.
Browsers without support fall back to normal wrapping — no harm done.

---

## 9. Naming Conventions

### 9.1 Class Names

| Pattern | Use | Example |
|---------|-----|---------|
| `kebab-case` | Components and elements | `.code-block`, `.card-title` |
| `.state` | State and variant modifiers | `.dark`, `.masked`, `.v` (vertical) |
| `data-*` attributes | JS integration | `data-fn`, `data-nwyt`, `data-theme` |

Template names become classes directly: `section.default`, `section.title`, `section.me`, etc.
Don't use BEM `__` `--` separators. Flat class names are easier to read when scope depth is shallow.

### 9.2 CSS Custom Properties

| Pattern | Use | Example |
|---------|-----|---------|
| `--name` | Global semantic tokens | `--base`, `--brand`, `--text-body` |
| `--component-property` | Component-local variables | `--footer-line-height`, `--footer-font-size` |

No namespace prefix (`--nun-*`). Short names are easier to read when scope is clear.

### 9.3 Logical Properties

Prefer logical properties over physical ones (for i18n and vertical writing support):

| Physical (avoid) | Logical (prefer) |
|------------------|------------------|
| `margin-top` | `margin-block-start` |
| `margin-bottom` | `margin-block-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| — | `inset: 0` as a shorthand alternative |

Exception: use physical properties where they are semantically accurate — e.g., coordinate assignment with `position: absolute`.

---

## 10. Interaction and Animation

```css
/* Color transitions: 0.15s */
a.card { transition: background-color 0.15s; }

/* Position / size transitions: 0.2s */
.tooltip { transition: opacity 0.2s, transform 0.2s; }

/* Focus indicator (accessibility required) */
button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
```

**`transition: all` is prohibited.** Name the properties being transitioned.
Explicit transitions are faster and communicate intent.

Slide page transitions use `view-transition-name` + CSS animations.
Because slides switch via `display: none` ↔ `display: grid`, the JS side calls `document.startViewTransition`.

---

## 11. Overflow Management

Slides are viewport-sized with `overflow: hidden`.
When content overflows, the client-side zoom-fit (`zoom` property) scales it down.

**Do not add `overflow: auto` or `overflow: scroll` to content areas.**
Scroll regions break the zoom-fit calculation.

Exceptions:
- `pre > code`: horizontal scroll is acceptable (`overflow-x: auto`)
- `.fn-tooltip`: uses `overflow: hidden` + `max-width` to control variable-length content

### When `min-height: 0` Is Required

The default `min-height` for Grid/Flex items is `auto` (content-based minimum).
A `1fr` allocation will still overflow if the content is taller.

```css
/* Fix for .body overflowing its grid track */
section.default > .body {
  min-height: 0; /* allows the grid item to shrink */
  overflow: hidden;
}
```

---

## 12. CSS and zoom-fit

The client JS `fitSlide()` function sets the `zoom` property on `.body`.

**`zoom` characteristics:**
- Affects layout (relationships with surrounding elements change)
- Does not change the `cqmin` baseline (`.slides` / `section` remain the reference after scaling)
- Different from `transform: scale` (`scale` does not affect layout)

**Interaction with `zoom`:**
- `em`-relative font sizes combined with `zoom` can cause double-scaling
- **Keep all font sizes in `clamp(px, cqmin, px)` tokens — don't rely on `em` inheritance**

---

## 13. Print and PDF

```css
@media print {
  /* One section per printed page */
  section {
    display: block !important;
    page-break-after: always;
    height: 100vh;
  }

  /* Reset fixed elements */
  section > footer {
    position: static;
  }
}
```

---

## 14. New Component Checklist

When adding a new component, verify each item in order:

- [ ] Colors and sizes specified via tokens only (no magic numbers)
- [ ] Layout uses Grid (Flex only if single-axis)
- [ ] Font sizes use `clamp()` + `cqmin` or `em`-relative (not absolute `px`)
- [ ] Hover and focus (`focus-visible`) interactions defined
- [ ] Dark mode works with token replacement alone
- [ ] `overflow` handling is compatible with zoom-fit
- [ ] Selector depth is shallow (max 2 levels)
- [ ] `@import` added to `index.css`
- [ ] `transition` names specific properties (not `transition: all`)

---

## 15. Common Pitfalls

**Overusing `flex-shrink: 0`**
Nearly unnecessary after migrating to Grid. Use an `auto` Grid track instead of preventing shrink.

**Forgetting `min-height: 0`**
Required when a `1fr` Grid/Flex item won't shrink. Pair it with `overflow: hidden`.

**`cqmin` resolves to 0**
Happens when there is no `container-type: size` ancestor. Verify that both `.slides` and `section` have `container-type: size`.

**`transition: all` is prohibited**
It transitions unintended properties and degrades performance. Name what you're animating.

**Confusing `zoom` with `transform: scale`**
`zoom` affects layout; `cqmin` baseline stays the same.
`transform: scale` does not affect layout; `cqmin` baseline also stays the same.
zoom-fit uses `zoom`. Don't mix them.

**`color-mix()` derived colors breaking in dark mode**
Derived tokens like `--muted` follow `--base` and `--main` automatically when they flip.
Don't override `--muted` individually for dark mode. If you need to tweak it, adjust the Primitive token instead.

---

## References

- [CUBE CSS](https://cube.fyi/) — CSS methodology by Andy Bell
- [Every Layout](https://every-layout.dev/) — Layout primitives by Andy Bell & Heydon Pickering
- [A More Modern CSS Reset](https://piccalil.li/blog/a-more-modern-css-reset/) — Andy Bell
- [Best Practices With CSS Grid Layout](https://www.smashingmagazine.com/2018/04/best-practices-grid-layout/) — Rachel Andrew (Smashing Magazine)
- [An Interactive Guide to CSS Container Queries](https://ishadeed.com/article/css-container-query-guide/) — Ahmad Shadeed
- [A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) — CSS-Tricks
- [Container Query Units](https://css-tricks.com/container-query-units-cqi-and-cqb/) — CSS-Tricks
- [The Developer's Guide to Design Tokens and CSS Variables](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/) — Penpot
