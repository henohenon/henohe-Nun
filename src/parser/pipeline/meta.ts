// Meta: per-slide .class/$var/template extraction, ## section split, tilde extraction

import { createFenceTracker } from '../markdown/fence';
import type { RawSlide } from './split';

export type TildeBuffers = {
  bg?: string;
  bgOptions: string[];
  fbg?: string;
  fbgOptions: string[];
  fr?: string;
  fl?: string;
  cardUrls: string[];
};

export type RawSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  lines: string[];
};

export type MetaSlide = {
  heading: string;
  classes: string[];
  vars: Record<string, string>;
  template: string;
  rawSections: RawSection[];
  tildeBuffers: TildeBuffers;
};

const CLASS_RE = /^(\.[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*)$/;
const VAR_RE = /^\$([a-zA-Z][\w-]*):\s*(.+)$/;
const TEMPLATE_RE = /^\u{1F30A}(\w+)\s*$/u;
const H2_RE = /^##\s*(.*)$/;
const TILDE_RE = /^(.+)~(\w+(?:\.\w[\w-]*)*)$/;
const MD_IMG_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const LINK_CARD_RE = /^\[([^\]]*)\]\(([^)]+)\)~card(?:\.\w+)*$/;

function isH2(line: string): boolean {
  const t = line.trim();
  return (t.startsWith('## ') || t === '##') && !t.startsWith('###');
}

function parseTildeOptions(optStr: string): { key: string; options: string[] } {
  const parts = optStr.split('.');
  return { key: parts[0], options: parts.slice(1) };
}

/** Extract tilde directives from section lines, mutating tildeBuffers.
 *  Returns cleaned lines (tilde-buffer lines removed, ~card lines kept for marked). */
function extractTildes(lines: string[], tildeBuffers: TildeBuffers, fence: ReturnType<typeof createFenceTracker>): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const { inFence, isBoundary } = fence(line);
    if (inFence || isBoundary) {
      out.push(line);
      continue;
    }

    const trimmed = line.trim();
    const tildeMatch = TILDE_RE.exec(trimmed);
    if (tildeMatch) {
      const value = tildeMatch[1].trim();
      const { key, options } = parseTildeOptions(tildeMatch[2]);

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
          // Collect URL for batch fetch, keep line for marked extension
          const cardMatch = LINK_CARD_RE.exec(trimmed);
          if (cardMatch) tildeBuffers.cardUrls.push(cardMatch[2]);
          out.push(line);
          continue;
        }
        default:
          break;
      }
    }

    out.push(line);
  }
  return out;
}

export function extractMeta(rawSlides: RawSlide[]): MetaSlide[] {
  return rawSlides.map((raw) => {
    const classes: string[] = [];
    const vars: Record<string, string> = {};
    let template = 'default';
    const contentLines: string[] = [];
    const tildeBuffers: TildeBuffers = { bgOptions: [], fbgOptions: [], cardUrls: [] };

    const fence = createFenceTracker();

    // First pass: extract slide-level meta from top of content
    let metaDone = false;
    for (const line of raw.lines) {
      const { inFence, isBoundary } = fence(line);
      if (inFence || isBoundary) {
        metaDone = true;
        contentLines.push(line);
        continue;
      }

      const trimmed = line.trim();

      if (!metaDone) {
        if (trimmed === '') continue;

        const cm = CLASS_RE.exec(trimmed);
        if (cm) {
          classes.push(...cm[1].split('.').filter(Boolean));
          continue;
        }
        const vm = VAR_RE.exec(trimmed);
        if (vm) {
          vars[vm[1]] = vm[2].trim();
          continue;
        }
        const tm = TEMPLATE_RE.exec(trimmed);
        if (tm) {
          template = tm[1];
          continue;
        }
      }

      metaDone = true;
      contentLines.push(line);
    }

    // Second pass: split by ## into sections
    const rawSections: RawSection[] = [{ classes: [], vars: {}, lines: [] }];
    const fence2 = createFenceTracker();

    for (const line of contentLines) {
      const { inFence, isBoundary } = fence2(line);
      if (!inFence && !isBoundary && isH2(line)) {
        const m = H2_RE.exec(line.trim());
        rawSections.push({
          heading: m?.[1].trim() || undefined,
          classes: [],
          vars: {},
          lines: [],
        });
        continue;
      }
      const current = rawSections[rawSections.length - 1];

      if (!inFence && !isBoundary) {
        const trimmed = line.trim();
        if (current.lines.length === 0 && trimmed === '') continue;
        if (current.lines.length === 0) {
          const cm = CLASS_RE.exec(trimmed);
          if (cm) {
            current.classes.push(...cm[1].split('.').filter(Boolean));
            continue;
          }
          const vm = VAR_RE.exec(trimmed);
          if (vm) {
            current.vars[vm[1]] = vm[2].trim();
            continue;
          }
        }
      }

      current.lines.push(line);
    }

    // Third pass: extract tildes from all sections
    const fence3 = createFenceTracker();
    for (const section of rawSections) {
      section.lines = extractTildes(section.lines, tildeBuffers, fence3);
    }

    return { heading: raw.heading, classes, vars, template, rawSections, tildeBuffers };
  });
}
