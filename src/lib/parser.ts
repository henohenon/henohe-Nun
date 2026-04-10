// Parser for henohe-Nun slide markdown.
// Splits input into slides by H1, extracts custom meta tags (@bg, @fr, etc.),
// and collects per-slide + global metadata. Body text (including HTML) is kept
// as a raw markdown string rendered by marked at display time.

import { createFenceTracker } from './markdown';
import type { AssetRef, Attrs, Deck, FooterText, Slide } from './types';

const KNOWN_TEMPLATES = new Set<string>([
  'title',
  'me',
  'default',
  'big',
  'small',
  'note',
] satisfies Slide['template'][]);

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

// --- line classification ---------------------------------------------------

type LineKind =
  | { t: 'h1'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'tmpl'; name: string }
  | { t: 'meta'; key: 'fr' | 'fl' | 'icon' | 'bg' | 'fbg' | 'date'; value: string; attrs: Attrs }
  | { t: 'md'; raw: string };

function classify(rawLine: string): LineKind {
  const line = rawLine.trim();

  // H2 (must check before H1)
  const h2 = /^##\s*(.*)$/.exec(line);
  if (h2 && !line.startsWith('###')) return { t: 'h2', text: h2[1] };

  // H1
  const h1 = /^#\s*(.*)$/.exec(line);
  if (h1) return { t: 'h1', text: h1[1] };

  // @>template
  const tmpl = /^@>\s*(\w+)\s*$/.exec(line);
  if (tmpl) return { t: 'tmpl', name: tmpl[1] };

  // @key attrs>value — meta tags
  const meta = /^@(fr|fl|icon|bg|fbg|date)(\s[^>]*)?>(.*)$/.exec(line);
  if (meta) {
    const key = meta[1] as 'fr' | 'fl' | 'icon' | 'bg' | 'fbg' | 'date';
    return { t: 'meta', key, value: meta[3].trim(), attrs: parseAttrs(meta[2] ?? '') };
  }

  return { t: 'md', raw: rawLine };
}

// --- main parser -----------------------------------------------------------

export function parseDeck(md: string): Deck {
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  const classified: LineKind[] = [];
  const fence = createFenceTracker();
  for (const line of lines) {
    const { inFence, isBoundary } = fence(line);
    classified.push(inFence || isBoundary ? { t: 'md', raw: line } : classify(line));
  }

  const deck: Deck = { slides: [] };

  // preamble: lines before first h1
  let i = 0;
  for (; i < classified.length; i++) {
    const k = classified[i];
    if (k.t === 'h1') break;
    if (k.t === 'meta') {
      if (k.key === 'date') deck.date = k.value;
      else if (k.key === 'fr') deck.globalFr = { text: k.value, attrs: k.attrs };
      else if (k.key === 'fl') deck.globalFl = { text: k.value, attrs: k.attrs };
      else if (k.key === 'bg') deck.globalBg = { src: k.value, attrs: k.attrs };
      else if (k.key === 'fbg') deck.globalFbg = { src: k.value, attrs: k.attrs };
    }
  }

  // slides
  while (i < classified.length) {
    const head = classified[i];
    if (head.t !== 'h1') {
      i++;
      continue;
    }
    const heading = head.text;
    i++;

    const slideLines: LineKind[] = [];
    while (i < classified.length && classified[i].t !== 'h1') {
      slideLines.push(classified[i]);
      i++;
    }

    let template: Slide['template'] = 'default';
    let subheading: string | undefined;
    let icon: AssetRef | undefined;
    let bg: AssetRef | undefined;
    let fbg: AssetRef | undefined;
    let fr: FooterText | undefined;
    let fl: FooterText | undefined;
    const bodyLines: string[] = [];

    for (const k of slideLines) {
      if (k.t === 'h2') {
        subheading = k.text;
        continue;
      }
      if (k.t === 'tmpl') {
        if (KNOWN_TEMPLATES.has(k.name)) {
          template = k.name as Slide['template'];
        } else {
          console.warn(`[henohe-nun] unknown template @>${k.name}, falling back to default`);
        }
        if (template === 'title') {
          if (deck.date) fr = { text: deck.date, attrs: {} };
          fl = { text: '', attrs: {} };
        }
        continue;
      }
      if (k.t === 'meta') {
        if (k.key === 'icon') icon = { src: k.value, attrs: k.attrs };
        else if (k.key === 'bg') bg = { src: k.value, attrs: k.attrs };
        else if (k.key === 'fbg') fbg = { src: k.value, attrs: k.attrs };
        else if (k.key === 'fr') fr = { text: k.value, attrs: k.attrs };
        else if (k.key === 'fl') fl = { text: k.value, attrs: k.attrs };
        continue;
      }
      if (k.t === 'md') {
        bodyLines.push(k.raw);
      }
    }

    // Trim leading/trailing blank lines from body
    while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
    while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();

    deck.slides.push({
      index: deck.slides.length,
      heading,
      subheading,
      template,
      icon,
      bg: bg ?? deck.globalBg,
      fbg: fbg ?? deck.globalFbg,
      fr: fr ?? deck.globalFr,
      fl: fl ?? deck.globalFl,
      body: bodyLines.join('\n'),
    });
  }

  return deck;
}
