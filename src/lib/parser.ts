// Deck parser, split into stages:
//
//   Stage 1 — parseDeck(md): splits the markdown into slide sources, each
//     carrying just the template name, heading, and raw content chunk. Also
//     extracts deck-wide preamble meta.
//
//   Stage 2 — parseFrame(source, i): for a single slide, pulls common meta
//     (@bg, @fr, @gap, ...) out of content into dedicated fields and leaves
//     the remainder as `bodyLines`.
//
//   Stage 3 — parseTitle / parseBody / parseNote / ... : template-specific
//     interpretation of `bodyLines` into the exact props each template
//     component needs. Called by Slide.astro after dispatching on template.
//
// Stages 2 and 3 are called from Slide.astro so that template-specific
// parsing sits right next to the rendering logic instead of leaking into a
// monolithic parseDeck.

import { createFenceTracker } from './markdown';
import type {
  Attrs,
  DeckSource,
  GlobalMeta,
  SlideFrame,
  SlideSource,
  TemplateName,
} from './types';

const KNOWN_TEMPLATES = new Set<TemplateName>([
  'title',
  'me',
  'default',
  'big',
  'small',
  'note',
  'row',
] satisfies TemplateName[]);

// --- attribute parser ------------------------------------------------------

export function parseAttrs(s: string): Attrs {
  const attrs: Attrs = {};
  const re = /([a-zA-Z_][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4];
    attrs[key] = val === undefined ? true : val;
  }
  return attrs;
}

// --- Stage 1: deck → global meta + slide sources ----------------------------

const H1_RE = /^#\s+(.*)$/;
const PREAMBLE_META_RE = /^@(fr|fl|bg|fbg|date)(\s[^>]*)?>(.*)$/;
const TEMPLATE_RE = /^@>\s*(\w+)\s*$/;

export function parseDeck(md: string): DeckSource {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const fence = createFenceTracker();

  const globalMeta: GlobalMeta = {};
  const slides: SlideSource[] = [];

  type Draft = { heading: string; template: TemplateName; lines: string[] };
  let current: Draft | null = null;

  const commit = () => {
    if (!current) return;
    slides.push({
      template: current.template,
      heading: current.heading,
      content: current.lines.join('\n'),
    });
    current = null;
  };

  for (const raw of lines) {
    const { inFence, isBoundary } = fence(raw);
    if (inFence || isBoundary) {
      current?.lines.push(raw);
      continue;
    }

    const trimmed = raw.trim();

    // H1 (slide boundary). Guard against H2+ matching via startsWith('##').
    if (!trimmed.startsWith('##')) {
      const h1 = H1_RE.exec(trimmed);
      if (h1) {
        commit();
        current = { heading: h1[1], template: 'default', lines: [] };
        continue;
      }
    }

    if (!current) {
      // Preamble — collect deck-wide meta.
      const meta = PREAMBLE_META_RE.exec(trimmed);
      if (meta) {
        const key = meta[1] as 'fr' | 'fl' | 'bg' | 'fbg' | 'date';
        const value = meta[3].trim();
        const attrs = parseAttrs(meta[2] ?? '');
        if (key === 'date') globalMeta.date = value;
        else if (key === 'fr') globalMeta.fr = { text: value, attrs };
        else if (key === 'fl') globalMeta.fl = { text: value, attrs };
        else if (key === 'bg') globalMeta.bg = { src: value, attrs };
        else if (key === 'fbg') globalMeta.fbg = { src: value, attrs };
      }
      continue;
    }

    // @>template — consumed here so Stage 2 doesn't see it.
    const tmpl = TEMPLATE_RE.exec(trimmed);
    if (tmpl) {
      const name = tmpl[1];
      if (KNOWN_TEMPLATES.has(name as TemplateName)) {
        current.template = name as TemplateName;
      } else {
        console.warn(`[henohe-nun] unknown template @>${name}, falling back to default`);
      }
      continue;
    }

    current.lines.push(raw);
  }
  commit();

  return { globalMeta, slides };
}

// --- Stage 2: source → frame (common meta extracted) ------------------------

const FRAME_META_RE = /^@(icon|bg|fbg|fr|fl|gap)(\s[^>]*)?>(.*)$/;

export function parseFrame(source: SlideSource, index: number): SlideFrame {
  const frame: SlideFrame = {
    index,
    heading: source.heading,
    template: source.template,
    bodyLines: [],
  };

  const fence = createFenceTracker();
  for (const line of source.content.split('\n')) {
    const { inFence, isBoundary } = fence(line);
    if (inFence || isBoundary) {
      frame.bodyLines.push(line);
      continue;
    }

    const meta = FRAME_META_RE.exec(line.trim());
    if (meta) {
      const key = meta[1] as 'icon' | 'bg' | 'fbg' | 'fr' | 'fl' | 'gap';
      const value = meta[3].trim();
      const attrs = parseAttrs(meta[2] ?? '');
      if (key === 'icon') frame.icon = { src: value, attrs };
      else if (key === 'bg') frame.bg = { src: value, attrs };
      else if (key === 'fbg') frame.fbg = { src: value, attrs };
      else if (key === 'fr') frame.fr = { text: value, attrs };
      else if (key === 'fl') frame.fl = { text: value, attrs };
      else if (key === 'gap') frame.gap = value;
      continue;
    }

    frame.bodyLines.push(line);
  }

  return frame;
}

// --- Stage 3: per-template body interpretation ------------------------------

// H2 matcher that ignores H3+ (### and deeper) and code fences.
const H2_RE = /^##\s*(.*)$/;

function isH2Line(line: string): boolean {
  const t = line.trim();
  return t.startsWith('## ') || t === '##' || (t.startsWith('##') && !t.startsWith('###'));
}

// Find the first H2 text (if any) and return the remaining lines with it
// removed. H2s inside code fences are ignored.
function takeFirstH2(lines: string[]): { text?: string; rest: string[] } {
  const rest: string[] = [];
  let text: string | undefined;
  const fence = createFenceTracker();
  for (const line of lines) {
    const { inFence, isBoundary } = fence(line);
    if (!inFence && !isBoundary && text === undefined && isH2Line(line)) {
      const m = H2_RE.exec(line.trim());
      text = m?.[1].trim() || undefined;
      continue;
    }
    rest.push(line);
  }
  return { text, rest };
}

// Drop every H2 line (not inside fences). Used by templates that don't expose
// a subtitle/caption — currently default / me / big / small / note (for the
// post-caption body).
function stripH2(lines: string[]): string[] {
  const out: string[] = [];
  const fence = createFenceTracker();
  for (const line of lines) {
    const { inFence, isBoundary } = fence(line);
    if (inFence || isBoundary) {
      out.push(line);
      continue;
    }
    if (isH2Line(line)) continue;
    out.push(line);
  }
  return out;
}

function joinTrimmed(lines: string[]): string {
  const copy = [...lines];
  while (copy.length && copy[0].trim() === '') copy.shift();
  while (copy.length && copy[copy.length - 1].trim() === '') copy.pop();
  return copy.join('\n');
}

// Title / Me: first H2 becomes the subtitle; body is ignored.
export function parseTitle(frame: SlideFrame): { subtitle?: string } {
  const { text } = takeFirstH2(frame.bodyLines);
  return { subtitle: text };
}

// Default / Me / Big / Small: join everything as a single markdown body,
// stripping H2 lines (they have no meaning for these templates).
export function parseBody(frame: SlideFrame): { body: string } {
  return { body: joinTrimmed(stripH2(frame.bodyLines)) };
}

// Note: first H2 becomes a caption shown below the centered body. Remaining
// H2s are ignored (same policy as parseBody).
export function parseNote(frame: SlideFrame): { body: string; caption?: string } {
  const { text, rest } = takeFirstH2(frame.bodyLines);
  return { body: joinTrimmed(stripH2(rest)), caption: text };
}

// Row: every H2 opens a new horizontal block. The H2 text becomes the block's
// title; an empty `## ` still produces a block (title-less). Content before
// the first H2 becomes a leading title-less block, but only if non-empty —
// otherwise a deck that opens directly with `## ` gets a clean first block.
export type RowBlock = { title?: string; body: string };
export function parseRow(frame: SlideFrame): { blocks: RowBlock[]; gap?: string } {
  const blocks: RowBlock[] = [];
  const fence = createFenceTracker();
  let title: string | undefined;
  let buf: string[] = [];
  let started = false; // true once the current block was opened by an H2

  const flush = () => {
    const body = joinTrimmed(buf);
    if (started || body) blocks.push({ title, body });
    title = undefined;
    buf = [];
    started = false;
  };

  for (const line of frame.bodyLines) {
    const { inFence, isBoundary } = fence(line);
    if (!inFence && !isBoundary && isH2Line(line)) {
      flush();
      const m = H2_RE.exec(line.trim());
      title = m?.[1].trim() || undefined;
      started = true;
      continue;
    }
    buf.push(line);
  }
  flush();

  return { blocks, gap: frame.gap };
}
