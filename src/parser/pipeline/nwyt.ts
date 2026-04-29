// Nwyt extraction: pull ~bg/~fbg/~fr/~fl/~icon/~caption out of article lines into buffers.
// ~card URLs are collected for OGP batching but the line stays in content.
// Recursively processes article children.

import { taggedLines } from '../markdown/fence';
import type { BgImage } from '../types';
import { LINK_CARD_RE, MD_IMG_RE, NWYT_RE, parseNwytOptions } from '../syntax';
import type { RawArticle } from './build';

export type NwytBuffers = {
  bg?: BgImage;
  fbg?: BgImage;
  fr?: string;
  fl?: string;
  cardUrls: string[];
};

function processArticle(article: RawArticle, nwytBuffers: NwytBuffers): RawArticle {
  const lines: string[] = [];
  let articleIcon: string | undefined;
  let articleIconOptions: string[] | undefined;
  let articleCaption: string | undefined;

  for (const { raw, trimmed, fenced } of taggedLines(article.lines)) {
    if (fenced) {
      lines.push(raw);
      continue;
    }

    const tm = NWYT_RE.exec(trimmed);
    if (tm) {
      const value = tm[1].trim();
      const { key, options } = parseNwytOptions(tm[2]);
      const imgMatch = MD_IMG_RE.exec(value);
      const src = imgMatch ? imgMatch[2] : value;

      switch (key) {
        case 'bg':
          nwytBuffers.bg = { src, options };
          continue;
        case 'fbg':
          nwytBuffers.fbg = { src, options };
          continue;
        case 'fr':
          nwytBuffers.fr = value;
          continue;
        case 'fl':
          nwytBuffers.fl = value;
          continue;
        case 'icon':
          articleIcon = src;
          articleIconOptions = options;
          continue;
        case 'caption':
          articleCaption = value;
          continue;
        case 'card': {
          const cardMatch = LINK_CARD_RE.exec(trimmed);
          if (cardMatch) nwytBuffers.cardUrls.push(cardMatch[2]);
          lines.push(raw);
          continue;
        }
        default:
          break;
      }
    }

    lines.push(raw);
  }

  // Recursively process children
  const children = article.children.map((child) => processArticle(child, nwytBuffers));

  return { ...article, lines, children, icon: articleIcon, iconOptions: articleIconOptions, caption: articleCaption };
}

export function extractNwyt(articles: RawArticle[]): { cleaned: RawArticle[]; nwytBuffers: NwytBuffers } {
  const nwytBuffers: NwytBuffers = { cardUrls: [] };
  const cleaned = articles.map((article) => processArticle(article, nwytBuffers));
  return { cleaned, nwytBuffers };
}
