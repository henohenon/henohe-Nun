// Parser for henohe-Nun slide markdown.
// Splits input into slides by H1, extracts custom tags, parses block tags (row/col/txt/img)
// into a tree, and collects per-slide + global metadata.

export type AttrValue = string | true;
export type Attrs = Record<string, AttrValue>;

export type Node =
  | { kind: 'markdown'; text: string }
  | { kind: 'row'; attrs: Attrs; children: Node[] }
  | { kind: 'col'; attrs: Attrs; children: Node[] }
  | { kind: 'txt'; attrs: Attrs; text: string }
  | { kind: 'img'; attrs: Attrs; src: string };

export type Slide = {
  index: number;
  heading: string;
  template: string;
  icon?: string;
  bg?: string;
  fr?: string;
  fl?: string;
  body: Node[];
  bodyLines: string[]; // non-tag markdown lines, trimmed empties at edges
};

export type Deck = {
  globalFr?: string;
  globalFl?: string;
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
  | { t: 'tmpl'; name: string }
  | { t: 'meta'; key: 'fr' | 'fl' | 'icon' | 'bg'; value: string }
  | { t: 'open'; name: 'row' | 'col'; attrs: Attrs }
  | { t: 'close'; name: 'row' | 'col' }
  | { t: 'inline'; node: Node }
  | { t: 'md'; raw: string };

function classify(rawLine: string): LineKind {
  const line = rawLine.trim();

  // H1
  const h1 = /^#\s*(.*)$/.exec(line);
  if (h1 && !line.startsWith('##')) return { t: 'h1', text: h1[1] };

  // <>template
  const tmpl = /^<>\s*(\w+)\s*$/.exec(line);
  if (tmpl) return { t: 'tmpl', name: tmpl[1] };

  // <fr>/<fl>/<icon>/<bg>
  const meta = /^<(fr|fl|icon|bg)>(.*)$/.exec(line);
  if (meta) return { t: 'meta', key: meta[1] as any, value: meta[2].trim() };

  // </row> </col>
  const close = /^<\/(row|col)>\s*$/.exec(line);
  if (close) return { t: 'close', name: close[1] as 'row' | 'col' };

  // <row ...> <col ...> (open, no content on same line)
  const open = /^<(row|col)(\s[^>]*)?>\s*$/.exec(line);
  if (open) return { t: 'open', name: open[1] as 'row' | 'col', attrs: parseAttrs(open[2] ?? '') };

  // inline single-line <txt ...>...</txt>
  const txt = /^<txt(\s[^>]*)?>(.*)<\/txt>\s*$/.exec(line);
  if (txt) return { t: 'inline', node: { kind: 'txt', attrs: parseAttrs(txt[1] ?? ''), text: txt[2] } };

  // inline single-line <img ...>path</img>
  const img = /^<img(\s[^>]*)?>(.*)<\/img>\s*$/.exec(line);
  if (img) return { t: 'inline', node: { kind: 'img', attrs: parseAttrs(img[1] ?? ''), src: rewriteAssetPath(img[2].trim()) } };

  return { t: 'md', raw: rawLine };
}

export function rewriteAssetPath(p: string): string {
  // `./images/foo.png` → `/images/foo.png` (Astro public/)
  // `/images/foo.png` → unchanged
  if (p.startsWith('./')) return p.slice(1);
  return p;
}

// --- body parser -----------------------------------------------------------

function parseBodyBlock(
  classified: LineKind[],
  startIdx: number,
  stopAt: null | 'row' | 'col',
): { nodes: Node[]; next: number } {
  const nodes: Node[] = [];
  const mdBuffer: string[] = [];
  const flushMd = () => {
    if (mdBuffer.length === 0) return;
    // trim leading/trailing blank lines
    while (mdBuffer.length && mdBuffer[0].trim() === '') mdBuffer.shift();
    while (mdBuffer.length && mdBuffer[mdBuffer.length - 1].trim() === '') mdBuffer.pop();
    if (mdBuffer.length) nodes.push({ kind: 'markdown', text: mdBuffer.join('\n') });
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
      mdBuffer.push(`</${k.name}>`);
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
    if (k.t === 'inline') {
      flushMd();
      nodes.push(k.node);
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
  const classified = lines.map(classify);

  const deck: Deck = { slides: [] };

  // preamble: lines before first h1
  let i = 0;
  for (; i < classified.length; i++) {
    const k = classified[i];
    if (k.t === 'h1') break;
    if (k.t === 'meta') {
      if (k.key === 'fr') deck.globalFr = k.value;
      else if (k.key === 'fl') deck.globalFl = k.value;
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
    let icon: string | undefined;
    let bg: string | undefined;
    let fr: string | undefined;
    let fl: string | undefined;
    const bodyInput: LineKind[] = [];
    const bodyLines: string[] = [];

    for (const k of slideLines) {
      if (k.t === 'tmpl') {
        template = k.name;
        if (!KNOWN_TEMPLATES.has(template)) {
          console.warn(`[henohe-nun] unknown template <>${template}, falling back to default`);
          template = 'default';
        }
        continue;
      }
      if (k.t === 'meta') {
        if (k.key === 'icon') icon = rewriteAssetPath(k.value);
        else if (k.key === 'bg') bg = rewriteAssetPath(k.value);
        else if (k.key === 'fr') fr = k.value;
        else if (k.key === 'fl') fl = k.value;
        continue;
      }
      bodyInput.push(k);
      if (k.t === 'md' && k.raw.trim() !== '') bodyLines.push(k.raw);
    }

    const { nodes: body } = parseBodyBlock(bodyInput, 0, null);

    deck.slides.push({
      index: deck.slides.length,
      heading,
      template,
      icon,
      bg,
      fr,
      fl,
      body,
      bodyLines,
    });
  }

  return deck;
}

// --- style helper ----------------------------------------------------------

const PX_KEYS = new Set(['w', 'h', 'l', 't', 'm', 'mt', 'mb', 'ml', 'mr', 'p', 'pt', 'pb', 'pl', 'pr', 'size']);

const CSS_MAP: Record<string, string> = {
  w: 'width',
  h: 'height',
  l: 'left',
  t: 'top',
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
  size: 'font-size',
  color: 'color',
};

export function attrsToStyle(attrs: Attrs): string {
  const parts: string[] = [];
  let absolute = false;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'src') continue;
    if (k === 'b' && v) parts.push('font-weight:bold');
    else if (k === 'i' && v) parts.push('font-style:italic');
    else if (k in CSS_MAP && typeof v === 'string') {
      const cssKey = CSS_MAP[k];
      const cssVal = PX_KEYS.has(k) && /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
      parts.push(`${cssKey}:${cssVal}`);
      if (k === 'l' || k === 't') absolute = true;
    }
  }
  if (absolute) parts.push('position:absolute');
  return parts.join(';');
}
