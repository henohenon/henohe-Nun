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

export type FooterText = { text: string; attrs: Attrs };
export type Background = { src: string; attrs: Attrs };

export type Slide = {
  index: number;
  heading: string;
  template: string;
  icon?: string;
  bg?: Background;
  fbg?: Background;
  fr?: FooterText;
  fl?: FooterText;
  body: Node[];
  bodyLines: string[]; // non-tag markdown lines, trimmed empties at edges
};

export type Deck = {
  globalFr?: FooterText;
  globalFl?: FooterText;
  globalBg?: Background;
  globalFbg?: Background;
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
  | { t: 'meta'; key: 'fr' | 'fl' | 'icon' | 'bg' | 'f-bg'; value: string; attrs: Attrs }
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

  // <fr>/<fl>/<icon>/<bg>/<f-bg>  (fr/fl/bg/f-bg also accept attrs)
  const meta = /^<(fr|fl|icon|bg|f-bg)(\s[^>]*)?>(.*)$/.exec(line);
  if (meta) {
    const key = meta[1] as 'fr' | 'fl' | 'icon' | 'bg' | 'f-bg';
    const attrs = key === 'icon' ? {} : parseAttrs(meta[2] ?? '');
    return { t: 'meta', key, value: meta[3].trim(), attrs };
  }

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
      if (k.key === 'fr') deck.globalFr = { text: k.value, attrs: k.attrs };
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
    let icon: string | undefined;
    let bg: Background | undefined;
    let fbg: Background | undefined;
    let fr: FooterText | undefined;
    let fl: FooterText | undefined;
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
        else if (k.key === 'bg') bg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
        else if (k.key === 'f-bg') fbg = { src: rewriteAssetPath(k.value), attrs: k.attrs };
        else if (k.key === 'fr') fr = { text: k.value, attrs: k.attrs };
        else if (k.key === 'fl') fl = { text: k.value, attrs: k.attrs };
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
      bg: bg ?? deck.globalBg,
      fbg: fbg ?? deck.globalFbg,
      fr,
      fl,
      body,
      bodyLines,
    });
  }

  return deck;
}

// --- style helper ----------------------------------------------------------

const PX_KEYS = new Set(['w', 'h', 'l', 'r', 't', 'b', 'm', 'mt', 'mb', 'ml', 'mr', 'p', 'pt', 'pb', 'pl', 'pr', 'size']);

const CSS_MAP: Record<string, string> = {
  w: 'width',
  h: 'height',
  l: 'left',
  r: 'right',
  t: 'top',
  b: 'bottom',
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
  opacity: 'opacity',
};

// Align keywords (boolean flags): left/right/center.
// Emit both text-align and align-self so they work in text blocks and flex items.
const ALIGN_MAP: Record<string, { text: string; self: string }> = {
  left: { text: 'left', self: 'flex-start' },
  right: { text: 'right', self: 'flex-end' },
  center: { text: 'center', self: 'center' },
};

// Background sizing rules (mirrors img sizing in NodeRenderer):
//   w only  -> `${w} auto`   (w-based, aspect preserved via auto)
//   h only  -> `auto ${h}`   (h-based, aspect preserved)
//   both    -> `${w} ${h}`   (explicit; note: aspect not preserved if values
//                             don't match the image's intrinsic ratio — CSS
//                             background-size can't express "contain within
//                             an arbitrary w×h box" without knowing the
//                             image's intrinsic size)
//   neither -> `cover`       (fill the slide, smaller slide dim wins)
export function bgSizeStyle(attrs: Attrs): string {
  const pxVal = (v: AttrValue): string =>
    typeof v === 'string' ? (/^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v) : '';
  const wv = attrs.w ? pxVal(attrs.w) : '';
  const hv = attrs.h ? pxVal(attrs.h) : '';
  const common = 'background-position:center;background-repeat:no-repeat';
  if (wv && hv) return `background-size:${wv} ${hv};${common}`;
  if (wv) return `background-size:${wv} auto;${common}`;
  if (hv) return `background-size:auto ${hv};${common}`;
  return 'background-size:cover;background-position:center';
}

export function attrsToStyle(attrs: Attrs): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'src') continue;
    // `b` is overloaded: `<... b>` (flag) = bold, `<... b=10>` = bottom offset.
    if (k === 'b' && v === true) parts.push('font-weight:bold', 'color:var(--theme-color)');
    else if (k === 'i' && v === true) parts.push('font-style:italic');
    else if (k in ALIGN_MAP && v === true) {
      const a = ALIGN_MAP[k];
      parts.push(`text-align:${a.text}`, `align-self:${a.self}`);
    }
    else if (k === 'blur' && typeof v === 'string') {
      const bv = /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
      parts.push(`filter:blur(${bv})`);
    }
    else if (k in CSS_MAP && typeof v === 'string') {
      const cssKey = CSS_MAP[k];
      const cssVal = PX_KEYS.has(k) && /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
      parts.push(`${cssKey}:${cssVal}`);
    }
  }
  return parts.join(';');
}
