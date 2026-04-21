// Deck parser: MD string -> structured Deck data

import type { MarkdownRenderers } from './markdown';
import { fetchOgpBatch } from './ogp-fetch';
import { buildDeckTree } from './pipeline/build';
import { renderSections } from './pipeline/render';
import { extractTildes } from './pipeline/tilde';
import type { Deck, Slide } from './types';

export type { MarkdownRenderers } from './markdown';
export type { Deck, Slide } from './types';

export async function parseDeck(md: string, renderers: MarkdownRenderers): Promise<Deck> {
  const tree = buildDeckTree(md);

  // Extract tildes from each slide's sections
  const slidesWithTildes = tree.slides.map((s) => {
    const { cleaned, tildeBuffers } = extractTildes(s.sections);
    return { ...s, sections: cleaned, tildeBuffers };
  });

  // Batch fetch OGP for all ~card URLs
  const allCardUrls = slidesWithTildes.flatMap((s) => s.tildeBuffers.cardUrls);
  const ogpMap = await fetchOgpBatch(allCardUrls);

  // Render sections and assemble final Slide[]
  const slides: Slide[] = slidesWithTildes.map((s, i) => {
    const sections = renderSections(s.sections, ogpMap, renderers);
    const { tildeBuffers } = s;

    const isTitle = s.template === 'title';
    let fr = tildeBuffers.fr ?? tree.fr ?? '';
    let fl = tildeBuffers.fl ?? tree.fl ?? '';
    if (isTitle && !fr && tree.frontmatter.date) fr = tree.frontmatter.date;

    return {
      index: i,
      heading: s.heading,
      classes: [...tree.classes, ...s.classes],
      vars: { ...tree.vars, ...s.vars },
      template: s.template,
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
    frontmatter: tree.frontmatter,
    classes: tree.classes,
    vars: tree.vars,
    slides,
  };
}
