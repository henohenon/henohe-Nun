// Deck parser: MD string -> structured Deck data

import type { MarkdownRenderers } from './markdown';
import { fetchOgpBatch } from './ogp-fetch';
import { buildDeckTree } from './pipeline/build';
import { extractNwyt } from './pipeline/nwyt';
import { renderArticles } from './pipeline/render';
import type { Deck, Slide } from './types';

export type { MarkdownRenderers } from './markdown';
export type { Deck, Slide } from './types';

export async function parseDeck(md: string, renderers: MarkdownRenderers): Promise<Deck> {
  const tree = buildDeckTree(md);

  // Extract nwyt (~key) from each slide's articles
  const slidesWithNwyt = tree.slides.map((s) => {
    const { cleaned, nwytBuffers } = extractNwyt(s.articles);
    return { articles: cleaned, nwytBuffers };
  });

  // Batch fetch OGP for all ~card URLs
  const allCardUrls = slidesWithNwyt.flatMap((s) => s.nwytBuffers.cardUrls);
  const ogpMap = await fetchOgpBatch(allCardUrls);

  // Render articles and assemble final Slide[]
  const slides: Slide[] = slidesWithNwyt.map((s) => {
    const articles = renderArticles(s.articles, ogpMap, renderers);
    const { nwytBuffers } = s;

    return {
      settings: {
        bg: nwytBuffers.bg,
        fbg: nwytBuffers.fbg,
        fr: nwytBuffers.fr,
        fl: nwytBuffers.fl,
      },
      articles,
    };
  });

  return {
    frontmatter: tree.frontmatter,
    defaults: { bg: tree.bg, fbg: tree.fbg, fr: tree.fr, fl: tree.fl },
    classes: tree.classes,
    vars: tree.vars,
    slides,
  };
}
