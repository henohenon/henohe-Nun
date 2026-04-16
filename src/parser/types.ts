/** Section within a slide, separated by ## */
export type Section = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  body: string; // HTML after marked
};

/** Parsed slide data */
export type Slide = {
  index: number;
  heading: string;
  classes: string[];
  vars: Record<string, string>;
  template: string;
  sections: Section[];
  // ~ buffers
  bg?: string;
  bgOptions: string[];
  fbg?: string;
  fbgOptions: string[];
  fr: string;
  fl: string;
};

/** Parsed deck data */
export type Deck = {
  frontmatter: Record<string, string>;
  classes: string[];
  vars: Record<string, string>;
  slides: Slide[];
};
