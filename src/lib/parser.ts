// Parser for henohe-Nun slide markdown.
// Splits input into slides by H1, extracts custom tags, parses block tags (row/col/<>)
// into a tree, and collects per-slide + global metadata.

export type AttrValue = string | true;
export type Attrs = Record<string, AttrValue>;

export type Node =
  | { kind: 'markdown'; text: string }
  | { kind: 'row'; attrs: Attrs; children: Node[] }
  | { kind: 'col'; attrs: Attrs; children: Node[] }
  | { kind: 'block'; attrs: Attrs; children: Node[] };

export type FooterText = { text: string; attrs: Attrs };
export type AssetRef = { src: string; attrs: Attrs };

export type Slide = {
  index: number;
  heading: string;
  subheading?: string;
  template: string;
  icon?: AssetRef;
  bg?: AssetRef;
  fbg?: AssetRef;
  fr?: FooterText;
  fl?: FooterText;
  body: Node[];
};

export type Deck = {
  date?: string;
  globalFr?: FooterText;
  globalFl?: FooterText;
  globalBg?: AssetRef;
  globalFbg?: AssetRef;
  slides: Slide[];
};

const KNOWN_TEMPLATES = new Set(['title', 'me', 'default', 'big', 'thx', 'note']);

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
  | { t: 'meta'; key: 'fr' | 'fl' | 'icon' | 'bg' | 'f-bg' | 'date'; value: string; attrs: Attrs }
  | { t: 'open'; name: 'row' | 'col' | 'block'; attrs: Attrs }
  | { t: 'close'; name: 'row' | 'col' | 'block' }
  | { t: 'inline-block'; attrs: Attrs; content: string }
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
  const meta = /^@(fr|fl|icon|bg|f-bg|date)(\s[^>]*)?>(.*)$/.exec(line);
  if (meta) {
    const key = meta[1] as 'fr' | 'fl' | 'icon' | 'bg' | 'f-bg' | 'date';
    return { t: 'meta', key, value: meta[3].trim(), attrs: parseAttrs(meta[2] ?? '') };
  }

  // </row> </col> </>
  const close = /^<\/(row|col)>\s*$/.exec(line);
  if (close) return { t: 'close', name: close[1] as 'row' | 'col' };
  if (/^<\/>\s*$/.test(line)) return { t: 'close', name: 'block' };

  // <row ...> <col ...> (open, no content on same line)
  const open = /^<(row|col)(\s[^>]*)?>\s*$/.exec(line);
  if (open) return { t: 'open', name: open[1] as 'row' | 'col', attrs: parseAttrs(open[2] ?? '') };

  // <attrs>content</> — inline block (single-line open+content+close)
  const inlineBlock = /^<([^>]*)>(.+)<\/>$/.exec(line);
  if (inlineBlock) return { t: 'inline-block', attrs: parseAttrs(inlineBlock[1] ?? ''), content: inlineBlock[2] };

  // <attrs> or <> — generic block open
  const block = /^<([^>]*)>$/.exec(line);
  if (block) return { t: 'open', name: 'block', attrs: parseAttrs(block[1] ?? '') };

  return { t: 'md', raw: rawLine };
}

export function rewriteAssetPath(p: string): string {
  // `./images/foo.png` -> `/images/foo.png` (Astro public/)
  // `/images/foo.png` -> unchanged
  if (p.startsWith('./')) return p.slice(1);
  return p;
}

// --- body parser -----------------------------------------------------------

function parseBodyBlock(
  classified: LineKind[],
  startIdx: number,
  stopAt: null | 'row' | 'col' | 'block',
): { nodes: Node[]; next: number } {
  const nodes: Node[] = [];
  const mdBuffer: string[] = [];
  const flushMd = () => {
    if (mdBuffer.length === 0) return;
    // trim leading/trailing blank lines
    while (mdBuffer.length && mdBuffer[0].trim() === '') mdBuffer.shift();
    while (mdBuffer.length && mdBuffer[mdBuffer.length - 1].trim() === '') mdBuffer.pop();
    if (mdBuffer.length) {
      // Strip common leading indent to prevent markdown code-block interpretation
      const nonEmpty = mdBuffer.filter((l) => l.trim() !== '');
      const minIndent = nonEmpty.length ? Math.min(...nonEmpty.map((l) => l.match(/^(\s*)/)?.[1].length ?? 0)) : 0;
      const dedented = minIndent > 0 ? mdBuffer.map((l) => l.slice(minIndent)) : mdBuffer;
      nodes.push({ kind: 'markdown', text: dedented.join('\n') });
    }
    mdBuffer.length = 0;
  };

  let i = startIdx;
  while (i < classified.length) {
    const k = classified[i];
    if (k.t === 'close') {
      if (stopAt && k.name === stopAt) {
        flushMd();
        return { nodes, next: i + 1 };
      }
      // stray close — treat as md
      mdBuffer.push(`</${k.name === 'block' ? '' : k.name}>`);
      i++;
      continue;
    }
    if (k.t === 'open') {
      flushMd();
      const { nodes: children, next } = parseBodyBlock(classified, i + 1, k.name);
      nodes.push({ kind: k.name, attrs: k.attrs, children });
      i = next;
      continue;
    }
    if (k.t === 'inline-block') {
      flushMd();
      const childText: Node = { kind: 'markdown', text: k.content };
      nodes.push({ kind: 'block', attrs: k.attrs, children: [childText] });
      i++;
      continue;
    }
    if (k.t === 'md') {
      mdBuffer.push(k.raw);
      i++;
      continue;
    }
    // h1/tmpl/meta shouldn't appear here (filtered earlier)
    i++;
  }
  flushMd();
  return { nodes, next: i };
}

// --- main parser -----------------------------------------------------------

export function parseDeck(md: string): Deck {
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  // Classify lines, but treat code-fenced regions as raw markdown
  // so that `# heading`, `@tag`, `<row>` etc. inside ``` blocks
  // are not interpreted as slide syntax.
  const classified: LineKind[] = [];
  let inFence = false;
  for (const line of lines) {
    const isFenceBoundary = /^\s*```/.test(line);
    if (isFenceBoundary) inFence = !inFence;
    // Fence boundaries themselves and everything inside → raw markdown
    classified.push(inFence || isFenceBoundary ? { t: 'md', raw: line } : classify(line));
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
      else if (k.key === 'bg') deck.globalBg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
      else if (k.key === 'f-bg') deck.globalFbg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
    }
    // other preamble content is ignored
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

    // collect lines until next h1
    const slideLines: LineKind[] = [];
    while (i < classified.length && classified[i].t !== 'h1') {
      slideLines.push(classified[i]);
      i++;
    }

    // extract per-slide metadata and template, leave the rest for body parsing
    let template = 'default';
    let subheading: string | undefined;
    let icon: AssetRef | undefined;
    let bg: AssetRef | undefined;
    let fbg: AssetRef | undefined;
    let fr: FooterText | undefined;
    let fl: FooterText | undefined;
    const bodyInput: LineKind[] = [];

    for (const k of slideLines) {
      if (k.t === 'h2') {
        subheading = k.text;
        continue;
      }
      if (k.t === 'tmpl') {
        template = k.name;
        if (!KNOWN_TEMPLATES.has(template)) {
          console.warn(`[henohe-nun] unknown template @>${template}, falling back to default`);
          template = 'default';
        }
        continue;
      }
      if (k.t === 'meta') {
        if (k.key === 'icon') icon = { src: rewriteAssetPath(k.value), attrs: k.attrs };
        else if (k.key === 'bg') bg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
        else if (k.key === 'f-bg') fbg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
        else if (k.key === 'fr') fr = { text: k.value, attrs: k.attrs };
        else if (k.key === 'fl') fl = { text: k.value, attrs: k.attrs };
        // `date` is deck-level only (preamble); ignore if used per-slide.
        continue;
      }
      bodyInput.push(k);
    }

    const { nodes: body } = parseBodyBlock(bodyInput, 0, null);

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
      body,
    });
  }

  return deck;
}

// --- style helper ----------------------------------------------------------

const PX_KEYS = new Set(['w', 'h', 'x', 'y', 'm', 'mt', 'mb', 'ml', 'mr', 'p', 'pt', 'pb', 'pl', 'pr', 's']);

// Append `px` when the value is a bare number; otherwise pass through (so `%`,
// `vw`, `calc(...)` etc. Just Work). Returns '' for boolean/undefined input.
export function pxUnit(v: AttrValue | undefined): string {
  if (typeof v !== 'string') return '';
  return /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}

const CSS_MAP: Record<string, string> = {
  w: 'width',
  h: 'height',
  x: 'left',
  y: 'top',
  m: 'margin',
  mt: 'margin-top',
  mb: 'margin-bottom',
  ml: 'margin-left',
  mr: 'margin-right',
  p: 'padding',
  pt: 'padding-top',
  pb: 'padding-bottom',
  pl: 'padding-left',
  pr: 'padding-right',
  s: 'font-size',
  color: 'color',
  opacity: 'opacity',
};

// Layout align keywords (boolean flags) — flex justify/align.
// Emits both container props (justify-content, align-items) and child prop
// (align-self) so the same keyword works whether the element is a flex
// container or a flex child.
type LayoutAlign = {
  justify?: string;
  items?: string;
  self?: string;
};
// Default mapping assumes flex-direction: column (main=vertical, cross=horizontal).
// When flexDir is 'row', left/right map to justify (main axis) instead of items.
function layoutAlign(key: string, flexDir?: 'row' | 'column'): LayoutAlign | undefined {
  const isRow = flexDir === 'row';
  const map: Record<string, LayoutAlign> = {
    top: isRow ? { items: 'flex-start', self: 'flex-start' } : { justify: 'flex-start' },
    bottom: isRow ? { items: 'flex-end', self: 'flex-end' } : { justify: 'flex-end' },
    left: isRow ? { justify: 'flex-start' } : { items: 'flex-start', self: 'flex-start' },
    right: isRow ? { justify: 'flex-end' } : { items: 'flex-end', self: 'flex-end' },
    vcenter: isRow ? { items: 'center', self: 'center' } : { justify: 'center' },
    hcenter: isRow ? { justify: 'center' } : { items: 'center', self: 'center' },
    center: { justify: 'center', items: 'center', self: 'center' },
  };
  return map[key];
}
const LAYOUT_ALIGN_KEYS = new Set(['top', 'bottom', 'left', 'right', 'vcenter', 'hcenter', 'center']);

// Text alignment keywords.
const TEXT_ALIGN: Record<string, string> = {
  tl: 'left',
  tr: 'right',
  tc: 'center',
};

// --- <img> style helpers for AssetRef ---
// Replaces the old background-image approach with object-fit/object-position.

const IMG_POSITION_KEYS = new Set([
  'w',
  'h',
  'x',
  'y',
  'left',
  'right',
  'top',
  'bottom',
  'center',
  'hcenter',
  'vcenter',
]);

export function imgFitStyle(attrs: Attrs): string {
  const wv = pxUnit(attrs.w);
  const hv = pxUnit(attrs.h);
  if (wv || hv) return 'object-fit:none';
  return 'object-fit:cover';
}

export function imgSizeStyle(attrs: Attrs): string {
  const wv = pxUnit(attrs.w);
  const hv = pxUnit(attrs.h);
  if (wv && hv) return `width:${wv};height:${hv}`;
  if (wv) return `width:${wv}`;
  if (hv) return `height:${hv}`;
  return '';
}

export function imgPositionStyle(attrs: Attrs): string {
  const { x: xv, y: yv, left, right, center, hcenter, top, bottom, vcenter } = attrs;

  let xPos: string;
  if (left === true) xPos = 'left';
  else if (right === true) xPos = 'right';
  else if (center === true || hcenter === true) xPos = 'center';
  else if (typeof xv === 'string') {
    if (/%$/.test(xv)) xPos = `calc(50% + ${xv.slice(0, -1)}cqw)`;
    else xPos = `calc(50% + ${pxUnit(xv)})`;
  } else xPos = 'center';

  let yPos: string;
  if (top === true) yPos = 'top';
  else if (bottom === true) yPos = 'bottom';
  else if (center === true || vcenter === true) yPos = 'center';
  else if (typeof yv === 'string') {
    if (/%$/.test(yv)) yPos = `calc(50% + ${yv.slice(0, -1)}cqh)`;
    else yPos = `calc(50% + ${pxUnit(yv)})`;
  } else yPos = 'center';

  return `object-position:${xPos} ${yPos}`;
}

export function imgAttrStyle(asset: AssetRef): string {
  const rest: Attrs = {};
  for (const [k, v] of Object.entries(asset.attrs)) {
    if (k === 'src') continue;
    if (!IMG_POSITION_KEYS.has(k)) rest[k] = v;
  }
  return [imgFitStyle(asset.attrs), imgSizeStyle(asset.attrs), imgPositionStyle(asset.attrs), attrsToStyle(rest)]
    .filter(Boolean)
    .join(';');
}

export function attrsToStyle(attrs: Attrs, flexDir?: 'row' | 'column'): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    // `b` = bold flag.
    if (k === 'b' && v === true) parts.push('font-weight:bold', 'color:var(--theme-color)');
    else if (k === 'i' && v === true) parts.push('font-style:italic');
    // Layout align
    else if (LAYOUT_ALIGN_KEYS.has(k) && v === true) {
      const a = layoutAlign(k, flexDir);
      if (a?.justify) parts.push(`justify-content:${a.justify}`);
      if (a?.items) parts.push(`align-items:${a.items}`);
      if (a?.self) parts.push(`align-self:${a.self}`);
    }
    // Text align
    else if (k in TEXT_ALIGN && v === true) {
      parts.push(`text-align:${TEXT_ALIGN[k]}`);
    } else if (k === 'blur' && typeof v === 'string') {
      parts.push(`filter:blur(${pxUnit(v)})`);
    } else if (k in CSS_MAP && typeof v === 'string') {
      const cssKey = CSS_MAP[k];
      const cssVal = PX_KEYS.has(k) ? pxUnit(v) : v;
      parts.push(`${cssKey}:${cssVal}`);
    }
  }
  return parts.join(';');
}
