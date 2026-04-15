// Render: ~ expansion (tilde postfix) + markdown rendering

import { createFenceTracker, renderMarkdown } from '../markdown';
import { fetchOgp, ogpToHtml } from '../ogp';
import type { RawSection } from './meta';

export type TildeBuffers = {
  bg?: string;
  bgOptions: string[];
  fbg?: string;
  fbgOptions: string[];
  fr?: string;
  fl?: string;
};

export type ResolvedSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  body: string;
};

// value~key or value~key.opt1.opt2
// For images: ![alt](path)~key.opt1.opt2
const TILDE_RE = /^(.+)~(\w+(?:\.\w[\w-]*)*)$/;
// Markdown image
const MD_IMG_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
// Bracket autolink: [url] (not ![...] or [...](...))
const BRACKET_RE = /(?<!!)\[([^\]]+)\](?!\()/g;
// @link>url (kept for backwards compat during migration)
const LINK_RE = /^@link(\s[^>]*)?>(.+)$/;

function parseTildeOptions(optStr: string): { key: string; options: string[] } {
  const parts = optStr.split('.');
  return { key: parts[0], options: parts.slice(1) };
}

/** Expand [https://...] bracket notation to markdown autolink */
function expandBrackets(line: string): string {
  return line.replace(BRACKET_RE, (_match, content: string) => {
    const trimmed = content.trim();
    if (/^https?:\/\//.test(trimmed)) return `[${trimmed}](${trimmed})`;
    return _match;
  });
}

/** Process a single section's lines: extract ~ directives, render markdown */
export async function renderSection(raw: RawSection, tildeBuffers: TildeBuffers): Promise<ResolvedSection> {
  const fence = createFenceTracker();
  const out: string[] = [];
  let blankRun = 0;

  const flushBlanks = () => {
    if (blankRun >= 2) {
      out.push('');
      out.push(`<div class="blank-spacer" style="--blanks:${blankRun - 1}"></div>`);
      out.push('');
    } else if (blankRun === 1) {
      out.push('');
    }
    blankRun = 0;
  };

  for (const line of raw.lines) {
    const { inFence, isBoundary } = fence(line);
    if (inFence || isBoundary) {
      flushBlanks();
      out.push(line);
      continue;
    }

    if (line.trim() === '') {
      blankRun++;
      continue;
    }
    flushBlanks();

    const trimmed = line.trim();

    // ~ postfix
    const tildeMatch = TILDE_RE.exec(trimmed);
    if (tildeMatch) {
      const value = tildeMatch[1].trim();
      const { key, options } = parseTildeOptions(tildeMatch[2]);

      // Extract image src if value is ![alt](path)
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
        default:
          // Unknown tilde key: pass through as-is
          break;
      }
    }

    // @link directive (backwards compat)
    const linkMatch = LINK_RE.exec(trimmed);
    if (linkMatch) {
      const url = linkMatch[2].trim();
      const ogp = await fetchOgp(url);
      if (ogp) {
        out.push(ogpToHtml(ogp, false));
      } else {
        out.push(`<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
      }
      continue;
    }

    out.push(expandBrackets(line));
  }
  flushBlanks();

  const body = await renderMarkdown(out.join('\n'));

  return {
    heading: raw.heading,
    classes: raw.classes,
    vars: raw.vars,
    body,
  };
}

/** Process all sections of a slide, collecting tilde buffers */
export async function renderSections(
  rawSections: RawSection[],
): Promise<{ sections: ResolvedSection[]; buffers: TildeBuffers }> {
  const buffers: TildeBuffers = { bgOptions: [], fbgOptions: [] };
  const sections = await Promise.all(rawSections.map((s) => renderSection(s, buffers)));
  return { sections, buffers };
}
