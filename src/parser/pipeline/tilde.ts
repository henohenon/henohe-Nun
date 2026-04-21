// Tilde extraction: pull ~bg/~fbg/~fr/~fl out of section lines into buffers.
// ~card URLs are collected for OGP batching but the line stays in content.

import { taggedLines } from '../markdown/fence';
import { LINK_CARD_RE, MD_IMG_RE, TILDE_RE, parseTildeOptions } from '../syntax';
import type { RawSection } from './build';

export type TildeBuffers = {
  bg?: string;
  bgOptions: string[];
  fbg?: string;
  fbgOptions: string[];
  fr?: string;
  fl?: string;
  cardUrls: string[];
};

export function extractTildes(sections: RawSection[]): { cleaned: RawSection[]; tildeBuffers: TildeBuffers } {
  const tildeBuffers: TildeBuffers = { bgOptions: [], fbgOptions: [], cardUrls: [] };

  const cleaned = sections.map((section) => {
    const lines: string[] = [];

    for (const { raw, trimmed, fenced } of taggedLines(section.lines)) {
      if (fenced) {
        lines.push(raw);
        continue;
      }

      const tm = TILDE_RE.exec(trimmed);
      if (tm) {
        const value = tm[1].trim();
        const { key, options } = parseTildeOptions(tm[2]);
        const imgMatch = MD_IMG_RE.exec(value);
        const src = imgMatch ? imgMatch[2] : value;

        switch (key) {
          case 'bg':
            tildeBuffers.bg = src;
            tildeBuffers.bgOptions = options;
            continue;
          case 'fbg':
            tildeBuffers.fbg = src;
            tildeBuffers.fbgOptions = options;
            continue;
          case 'fr':
            tildeBuffers.fr = value;
            continue;
          case 'fl':
            tildeBuffers.fl = value;
            continue;
          case 'card': {
            const cardMatch = LINK_CARD_RE.exec(trimmed);
            if (cardMatch) tildeBuffers.cardUrls.push(cardMatch[2]);
            lines.push(raw);
            continue;
          }
          default:
            break;
        }
      }

      lines.push(raw);
    }

    return { ...section, lines };
  });

  return { cleaned, tildeBuffers };
}
