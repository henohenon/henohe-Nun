import type { TokenizerAndRendererExtension } from 'marked';
import type { OgpData } from '../ogp-fetch';
import { ogpToHtml } from './link-card';
import { escapeHtml } from './code';

/** Block extension: 3+ consecutive blank lines → spacer div */
export function spacerExtension(): TokenizerAndRendererExtension {
  return {
    name: 'spacer',
    level: 'block',
    start(src) {
      return src.match(/\n{3,}/)?.index;
    },
    tokenizer(src) {
      const match = /^(\n{3,})/.exec(src);
      if (match) {
        return { type: 'spacer', raw: match[0], blanks: match[1].length - 1 };
      }
    },
    renderer(token) {
      return `<div class="blank-spacer" style="--blanks:${(token as unknown as { blanks: number }).blanks}"></div>\n`;
    },
  };
}

/** Block extension: [alt](url)~card or [alt](url)~card.v → OGP link card */
export function linkCardExtension(ogpMap: Map<string, OgpData | null>): TokenizerAndRendererExtension {
  return {
    name: 'linkCard',
    level: 'block',
    start(src) {
      return src.match(/^\[/m)?.index;
    },
    tokenizer(src) {
      const match = /^\[([^\]]*)\]\(([^)]+)\)~card(?:\.(v|horiz))?\s*(?:\n|$)/.exec(src);
      if (match) {
        return {
          type: 'linkCard',
          raw: match[0],
          url: match[2],
          vertical: match[3] === 'v' || match[3] === 'horiz',
        };
      }
    },
    renderer(token) {
      const { url, vertical } = token as unknown as { url: string; vertical: boolean };
      const ogp = ogpMap.get(url);
      if (ogp) return ogpToHtml(ogp, vertical);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>\n`;
    },
  };
}
