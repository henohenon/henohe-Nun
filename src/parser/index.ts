// buildDeck: MD string → full HTML string for all slides

import { slideWrapper } from './html/parts';
import { templates } from './html/templates';
import { splitDeck } from './pipeline/split';
import { extractMeta } from './pipeline/meta';
import { renderSections } from './pipeline/render';
import type { Deck, Slide } from './types';

export type { Deck, Slide } from './types';

/** Parse markdown into structured Deck data */
export async function parseDeck(md: string): Promise<Deck> {
  const s1 = splitDeck(md);
  const s2slides = extractMeta(s1.rawSlides);

  const slides: Slide[] = await Promise.all(
    s2slides.map(async (s2, i) => {
      const { sections, buffers } = await renderSections(s2.rawSections);

      // Title template special cases
      const isTitle = s2.template === 'title' || s2.template === 'hero';
      let fr = buffers.fr;
      let fl = buffers.fl;
      if (isTitle) {
        if (!fr && s1.frontmatter.date) fr = s1.frontmatter.date;
        if (!fl) fl = '';
      }

      return {
        index: i,
        heading: s2.heading,
        classes: [...s1.classes, ...s2.classes],
        vars: { ...s1.vars, ...s2.vars },
        template: s2.template,
        sections,
        bg: buffers.bg,
        bgOptions: buffers.bgOptions,
        fbg: buffers.fbg,
        fbgOptions: buffers.fbgOptions,
        fr: fr ?? undefined,
        fl: fl ?? undefined,
      };
    }),
  );

  return {
    frontmatter: s1.frontmatter,
    classes: s1.classes,
    vars: s1.vars,
    slides,
  };
}

/** Render a single slide to HTML */
export function renderSlide(slide: Slide, deck: Deck): string {
  const templateFn = templates[slide.template] ?? templates.default;
  const inner = templateFn({
    heading: slide.heading,
    sections: slide.sections,
  });

  // Inherit deck-level buffers for bg/fbg/fr/fl if not set on slide
  // (this is done at parse time for fr/fl, but bg/fbg are done here)
  const effectiveBg = slide.bg;
  const effectiveFbg = slide.fbg;

  // Title fallback: use fbg as bg if no bg specified
  const isTitle = slide.template === 'title' || slide.template === 'hero';
  const bg = effectiveBg ?? (isTitle ? effectiveFbg : undefined);

  return slideWrapper({
    index: slide.index,
    classes: slide.classes,
    vars: slide.vars,
    bg,
    bgOptions: slide.bgOptions,
    fr: slide.fr,
    fl: slide.fl,
    fbg: effectiveFbg,
    fbgOptions: slide.fbgOptions,
    inner,
  });
}

/** Build full deck HTML (just the slides, no shell/head) */
export async function buildDeck(md: string): Promise<string> {
  const deck = await parseDeck(md);
  return deck.slides.map((slide) => renderSlide(slide, deck)).join('\n');
}
