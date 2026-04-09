export type AttrValue = string | true;
export type Attrs = Record<string, AttrValue>;

export type FooterText = { text: string; attrs: Attrs };
export type AssetRef = { src: string; attrs: Attrs };

export type Slide = {
  index: number;
  heading: string;
  subheading?: string;
  template: 'title' | 'me' | 'default' | 'big' | 'small' | 'note';
  icon?: AssetRef;
  bg?: AssetRef;
  fbg?: AssetRef;
  fr?: FooterText;
  fl?: FooterText;
  body: string;
};

export type Deck = {
  date?: string;
  globalFr?: FooterText;
  globalFl?: FooterText;
  globalBg?: AssetRef;
  globalFbg?: AssetRef;
  slides: Slide[];
};
