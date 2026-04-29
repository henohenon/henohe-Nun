/** Background image with UnoCSS option classes. */
export type BgImage = {
  src: string;
  options: string[];
};

/** Slide-level visual settings (background layers + footer). */
export type SlideSettings = {
  bg?: BgImage;
  fbg?: BgImage;
  fr?: string;
  fl?: string;
};

/** Article within a slide, separated by heading (#–######). Nested by heading level. */
export type Article = {
  heading?: string;
  headingLevel: number;
  template: string;
  classes: string[];
  bodyClasses: string[];
  vars: Record<string, string>;
  body: string; // HTML after marked
  children: Article[];
  icon?: string;
  iconOptions?: string[];
  caption?: string;
};

/** Parsed slide data */
export type Slide = {
  settings: SlideSettings;
  articles: Article[];
};

/** Parsed deck data */
export type Deck = {
  frontmatter: Record<string, string>;
  defaults: SlideSettings;
  classes: string[];
  vars: Record<string, string>;
  slides: Slide[];
};
