// Meta: per-slide .class $var extraction, template declaration, ## section split

import { createFenceTracker } from '../markdown';
import type { RawSlide } from './split';

export type RawSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  lines: string[];
};

export type Stage2Slide = {
  heading: string;
  classes: string[];
  vars: Record<string, string>;
  template: string;
  rawSections: RawSection[];
};

const CLASS_RE = /^(\.[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*)$/;
const VAR_RE = /^\$([a-zA-Z][\w-]*):\s*(.+)$/;
const TEMPLATE_RE = /^\u{1F30A}(\w+)\s*$/u;
const H2_RE = /^##\s*(.*)$/;

function isH2(line: string): boolean {
  const t = line.trim();
  return (t.startsWith('## ') || t === '##') && !t.startsWith('###');
}

export function extractMeta(rawSlides: RawSlide[]): Stage2Slide[] {
  return rawSlides.map((raw) => {
    const classes: string[] = [];
    const vars: Record<string, string> = {};
    let template = 'default';
    const contentLines: string[] = [];

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

      // Meta lines only at the top (before any content)
      if (!metaDone) {
        if (trimmed === '') continue; // skip blank lines in meta area

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

      // Extract section-level .class and $var from top of section
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

    return { heading: raw.heading, classes, vars, template, rawSections };
  });
}
