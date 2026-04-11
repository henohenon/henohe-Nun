export type AttrValue = string | true;
export type Attrs = Record<string, AttrValue>;

export type FooterText = { text: string; attrs: Attrs };
export type AssetRef = { src: string; attrs: Attrs };

export type TemplateName = 'title' | 'me' | 'default' | 'big' | 'small' | 'note' | 'row';

// Deck-wide meta extracted from the preamble (lines before the first H1).
export type GlobalMeta = {
  date?: string;
  fr?: FooterText;
  fl?: FooterText;
  bg?: AssetRef;
  fbg?: AssetRef;
  theme?: string;
  colors?: Record<string, string>;
};

// Stage 1 output — one entry per slide. `content` is everything between the
// H1 header and the next H1, with the `@>template` directive already stripped.
// Per-slide meta (@bg, @fr, etc.) is still embedded in `content` and handled
// in Stage 2.
export type SlideSource = {
  template: TemplateName;
  heading: string;
  content: string;
};

export type DeckSource = {
  globalMeta: GlobalMeta;
  slides: SlideSource[];
};

// Stage 2 output — per-slide common meta extracted, with `bodyLines` holding
// the raw lines that weren't consumed by any @-meta directive. Template-
// specific body parsers (parseTitle, parseBody, parseNote, ...) further
// interpret `bodyLines` to produce the final props for each template.
export type SlideFrame = {
  index: number;
  heading: string;
  template: TemplateName;
  icon?: AssetRef;
  bg?: AssetRef;
  fbg?: AssetRef;
  fr?: FooterText;
  fl?: FooterText;
  theme?: string;
  colors?: Record<string, string>;
  bodyLines: string[];
};
