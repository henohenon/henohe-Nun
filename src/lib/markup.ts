// Slide markup processor: takes a raw body string, resolves custom directives
// (@img, @link, [path] brackets) and pipes the result through the markdown
// renderer. Runs at Astro build time (async for getImage / fetchOgp).
//
// Separated from Markup.astro so directive handling is plain TS and the
// component becomes a thin `<Fragment set:html={...} />` wrapper.

import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { createFenceTracker, renderMarkdown } from './markdown';
import { fetchOgp, ogpToHtml } from './ogp';
import { parseAttrs } from './parser';
import { attrsToCommon, attrsToObject } from './style';

const astroImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{png,jpg,jpeg,svg,gif,webp,avif}',
  { eager: true },
);

// Resolve an image path against /src/assets/images and run it through
// astro:assets for optimization. Falls back to the raw src if unmatched
// (e.g. external URL or /public asset).
export async function resolveImageUrl(src: string, width = 1920): Promise<string> {
  const matched = astroImages[`/src/assets/images${src}`];
  if (matched) {
    const optimized = await getImage({ src: matched.default, width });
    return optimized.src;
  }
  return src;
}

const IMG_RE = /^@img(\s[^>]*)?>(.+)$/;
const IMG_ALT_RE = /^!\[([^\]]*)\]\((.+)\)$/;
const LINK_RE = /^@link(\s[^>]*)?>(.+)$/;
// [content] that isn't a markdown link [label](url) or image ![label](url)
const BRACKET_RE = /(?<!!)\[([^\]]+)\](?!\()/g;

// --- directive handlers ----------------------------------------------------

async function handleImg(match: RegExpExecArray): Promise<string> {
  const attrs = parseAttrs(match[1] ?? '');
  const src = match[2].trim();

  // @img>![alt](path) → <img> with alt text
  const altMatch = IMG_ALT_RE.exec(src);
  const alt = altMatch ? altMatch[1] : '';
  const imgPath = altMatch ? altMatch[2].trim() : src;
  const url = await resolveImageUrl(imgPath);
  const style = [attrsToCommon(attrs), attrsToObject(attrs)].filter(Boolean).join(';');
  return `<img src="${url}" alt="${alt}"${style ? ` style="${style}"` : ''} />`;
}

async function handleLink(match: RegExpExecArray): Promise<string> {
  const attrs = parseAttrs(match[1] ?? '');
  const url = match[2].trim();
  const ogp = await fetchOgp(url);
  if (ogp) return ogpToHtml(ogp, attrs.v === true);
  return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
}

// [https://...] → [url](url) autolink
async function expandBrackets(line: string): Promise<string> {
  let out = line;
  for (const m of line.matchAll(BRACKET_RE)) {
    const content = m[1].trim();
    if (/^https?:\/\//.test(content)) {
      out = out.replace(m[0], `[${content}](${content})`);
    }
  }
  return out;
}

// --- public entry ----------------------------------------------------------

export async function renderMarkup(body: string): Promise<string> {
  if (!body) return '';

  const fence = createFenceTracker();
  const out: string[] = [];
  // Track consecutive blank lines (outside fences) so a run of N blanks can
  // be collapsed into a single `<div class="blank-spacer">` whose height is
  // driven by a `--blanks` custom property. One blank still behaves as a
  // normal paragraph break; 2+ blanks emit a spacer sized by (N-1).
  let blankRun = 0;
  const flushBlankRun = () => {
    if (blankRun >= 2) {
      // Surround the HTML block with blank lines so marked treats it as a
      // standalone block and doesn't fold it into an adjacent paragraph.
      out.push('');
      out.push(`<div class="blank-spacer" style="--blanks:${blankRun - 1}"></div>`);
      out.push('');
    } else if (blankRun === 1) {
      out.push('');
    }
    blankRun = 0;
  };

  for (const line of body.split('\n')) {
    const { inFence, isBoundary } = fence(line);
    if (inFence || isBoundary) {
      flushBlankRun();
      out.push(line);
      continue;
    }
    if (line.trim() === '') {
      blankRun++;
      continue;
    }
    flushBlankRun();
    const trimmed = line.trim();
    const imgMatch = IMG_RE.exec(trimmed);
    if (imgMatch) {
      out.push(await handleImg(imgMatch));
      continue;
    }
    const linkMatch = LINK_RE.exec(trimmed);
    if (linkMatch) {
      out.push(await handleLink(linkMatch));
      continue;
    }
    out.push(await expandBrackets(line));
  }
  flushBlankRun();

  return renderMarkdown(out.join('\n'));
}
