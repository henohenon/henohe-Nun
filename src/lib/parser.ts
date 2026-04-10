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
import type { Attrs, DeckSource, GlobalMeta, SlideFrame, SlideSource, TemplateName } from './types';

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

const FRAME_META_RE = /^@(icon|bg|fbg|fr|fl)(\s[^>]*)?>(.*)$/;

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
      const key = meta[1] as 'icon' | 'bg' | 'fbg' | 'fr' | 'fl';
      const value = meta[3].trim();
      const attrs = parseAttrs(meta[2] ?? '');
      if (key === 'icon') frame.icon = { src: value, attrs };
      else if (key === 'bg') frame.bg = { src: value, attrs };
      else if (key === 'fbg') frame.fbg = { src: value, attrs };
      else if (key === 'fr') frame.fr = { text: value, attrs };
      else if (key === 'fl') frame.fl = { text: value, attrs };
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

// Split lines into segments at every H2 (ignoring fenced code). The first
// segment is always pre-H2 content (`started: false`); subsequent segments
// are opened by an H2 (`started: true`) and carry that H2's text as `title`.
// H2 lines themselves are not included in any segment's `lines`.
type H2Segment = { title?: string; started: boolean; lines: string[] };
function splitByH2(lines: string[]): H2Segment[] {
  const segs: H2Segment[] = [{ started: false, lines: [] }];
  const fence = createFenceTracker();
  for (const line of lines) {
    const { inFence, isBoundary } = fence(line);
    if (!inFence && !isBoundary && isH2Line(line)) {
      const m = H2_RE.exec(line.trim());
      segs.push({ title: m?.[1].trim() || undefined, started: true, lines: [] });
      continue;
    }
    segs[segs.length - 1].lines.push(line);
  }
  return segs;
}

function joinTrimmed(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end).join('\n');
}

// Title / Me: first H2 becomes the subtitle; body is ignored.
export function parseTitle(frame: SlideFrame): { subtitle?: string } {
  return { subtitle: splitByH2(frame.bodyLines)[1]?.title };
}

// Default / Me / Big / Small: join everything as a single markdown body,
// stripping H2 lines (they have no meaning for these templates).
export function parseBody(frame: SlideFrame): { body: string } {
  const lines = splitByH2(frame.bodyLines).flatMap((s) => s.lines);
  return { body: joinTrimmed(lines) };
}

// Note: first H2 becomes a caption shown below the centered body. Remaining
// H2s are ignored (same policy as parseBody).
export function parseNote(frame: SlideFrame): { body: string; caption?: string } {
  const segs = splitByH2(frame.bodyLines);
  const caption = segs[1]?.title;
  const lines = segs.flatMap((s) => s.lines);
  return { body: joinTrimmed(lines), caption };
}

// Row: every H2 opens a new horizontal block. The H2 text becomes the block's
// title; an empty `## ` still produces a block (title-less). Content before
// the first H2 becomes a leading title-less block, but only if non-empty —
// otherwise a deck that opens directly with `## ` gets a clean first block.
// `@gap` / `@align` are row-local meta extracted from `bodyLines` here so
// they don't leak into the shared SlideFrame type.
const ROW_META_RE = /^@(gap|align)(\s[^>]*)?>(.*)$/;
export type RowBlock = { title?: string; body: string };
export function parseRow(frame: SlideFrame): {
  blocks: RowBlock[];
  gap?: string;
  align?: string;
} {
  let gap: string | undefined;
  let align: string | undefined;
  const content: string[] = [];
  const fence = createFenceTracker();
  for (const line of frame.bodyLines) {
    const { inFence, isBoundary } = fence(line);
    if (!inFence && !isBoundary) {
      const m = ROW_META_RE.exec(line.trim());
      if (m) {
        const value = m[3].trim();
        if (m[1] === 'gap') gap = value;
        else align = value;
        continue;
      }
    }
    content.push(line);
  }

  const blocks: RowBlock[] = [];
  for (const seg of splitByH2(content)) {
    const body = joinTrimmed(seg.lines);
    if (seg.started || body) blocks.push({ title: seg.title, body });
  }

  return { blocks, gap, align };
}
