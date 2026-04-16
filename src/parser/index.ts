// Deck parser: MD string -> structured Deck data

import type { MarkdownRenderers } from './markdown';
import { fetchOgpBatch } from './ogp-fetch';
import { extractMeta } from './pipeline/meta';
import { renderSections } from './pipeline/render';
import { splitDeck } from './pipeline/split';
import type { Deck, Slide } from './types';

export type { MarkdownRenderers } from './markdown';
export type { Deck, Slide } from './types';

export async function parseDeck(md: string, renderers: MarkdownRenderers): Promise<Deck> {
  const s1 = splitDeck(md);
  const metaSlides = extractMeta(s1.rawSlides);

  // Collect all ~card URLs across all slides, batch fetch OGP
  const allCardUrls = metaSlides.flatMap((s) => s.tildeBuffers.cardUrls);
  const ogpMap = await fetchOgpBatch(allCardUrls);

  const slides: Slide[] = metaSlides.map((ms, i) => {
    const sections = renderSections(ms.rawSections, ogpMap, renderers);
    const { tildeBuffers } = ms;

    const isTitle = ms.template === 'title' || ms.template === 'hero';
    let fr = tildeBuffers.fr ?? s1.fr ?? '';
    let fl = tildeBuffers.fl ?? s1.fl ?? '';
    if (isTitle && !fr && s1.frontmatter.date) fr = s1.frontmatter.date;

    return {
      index: i,
      heading: ms.heading,
      classes: [...s1.classes, ...ms.classes],
      vars: { ...s1.vars, ...ms.vars },
      template: ms.template,
      sections,
      bg: tildeBuffers.bg,
      bgOptions: tildeBuffers.bgOptions,
      fbg: tildeBuffers.fbg,
      fbgOptions: tildeBuffers.fbgOptions,
      fr,
      fl,
    };
  });

  return {
    frontmatter: s1.frontmatter,
    classes: s1.classes,
    vars: s1.vars,
    slides,
  };
}
