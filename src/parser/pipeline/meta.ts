// Meta: per-slide .class/$var/template extraction, ## section split, tilde extraction

import { taggedLines } from '../markdown/fence';
import {
  CLASS_RE,
  H2_RE,
  LINK_CARD_RE,
  MD_IMG_RE,
  TEMPLATE_RE,
  TILDE_RE,
  VAR_RE,
  parseClasses,
  parseTildeOptions,
} from '../syntax';
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

// --- Pass 1: slide-level meta (.class, $var, template) from top of content ---

type SlideMeta = {
  classes: string[];
  vars: Record<string, string>;
  template: string;
  contentLines: string[];
};

function extractSlideMeta(lines: string[]): SlideMeta {
  const classes: string[] = [];
  const vars: Record<string, string> = {};
  let template = 'default';
  const contentLines: string[] = [];
  let metaDone = false;

  for (const { raw, trimmed, fenced } of taggedLines(lines)) {
    if (fenced) {
      metaDone = true;
      contentLines.push(raw);
      continue;
    }

    if (!metaDone) {
      if (trimmed === '') continue;

      const cm = CLASS_RE.exec(trimmed);
      if (cm) {
        classes.push(...parseClasses(cm[1]));
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
    contentLines.push(raw);
  }

  return { classes, vars, template, contentLines };
}

// --- Pass 2: split content lines into ## sections ---

function splitSections(lines: string[]): RawSection[] {
  const sections: RawSection[] = [{ classes: [], vars: {}, lines: [] }];

  for (const { raw, trimmed, fenced } of taggedLines(lines)) {
    if (!fenced && (trimmed.startsWith('## ') || trimmed === '##') && !trimmed.startsWith('###')) {
      const m = H2_RE.exec(trimmed);
      sections.push({ heading: m?.[1].trim() || undefined, classes: [], vars: {}, lines: [] });
      continue;
    }

    const current = sections[sections.length - 1];

    if (!fenced && current.lines.length === 0) {
      if (trimmed === '') continue;
      const cm = CLASS_RE.exec(trimmed);
      if (cm) {
        current.classes.push(...parseClasses(cm[1]));
        continue;
      }
      const vm = VAR_RE.exec(trimmed);
      if (vm) {
        current.vars[vm[1]] = vm[2].trim();
        continue;
      }
    }

    current.lines.push(raw);
  }

  return sections;
}

// --- Pass 3: extract ~tilde directives from section lines ---

function extractTildes(sections: RawSection[]): { cleaned: RawSection[]; tildeBuffers: TildeBuffers } {
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

// --- Compose: rawSlide → MetaSlide ---

export function extractMeta(rawSlides: RawSlide[]): MetaSlide[] {
  return rawSlides.map((raw) => {
    const meta = extractSlideMeta(raw.lines);
    const sections = splitSections(meta.contentLines);
    const { cleaned, tildeBuffers } = extractTildes(sections);

    return {
      heading: raw.heading,
      classes: meta.classes,
      vars: meta.vars,
      template: meta.template,
      rawSections: cleaned,
      tildeBuffers,
    };
  });
}
