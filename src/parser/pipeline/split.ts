// Split: frontmatter extraction + split by H1 + root .class $var extraction

import { createFenceTracker } from '../markdown';

export type RawSlide = {
  heading: string;
  lines: string[];
};

export type Stage1Result = {
  frontmatter: Record<string, string>;
  classes: string[];
  vars: Record<string, string>;
  rawSlides: RawSlide[];
};

const H1_RE = /^#\s+(.*)$/;
const CLASS_RE = /^(\.[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*)$/;
const VAR_RE = /^\$([a-zA-Z][\w-]*):\s*(.+)$/;

/** Parse simple YAML-like frontmatter (key: value lines) */
function parseFrontmatter(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = /^(\w[\w-]*):\s*(.+)$/.exec(line.trim());
    if (m) result[m[1]] = m[2];
  }
  return result;
}

export function splitDeck(md: string): Stage1Result {
  const text = md.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const fence = createFenceTracker();

  let frontmatter: Record<string, string> = {};
  const classes: string[] = [];
  const vars: Record<string, string> = {};
  const rawSlides: RawSlide[] = [];

  let current: RawSlide | null = null;
  let lineIdx = 0;

  // Extract frontmatter if present
  if (lines[0]?.trim() === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) {
      frontmatter = parseFrontmatter(lines.slice(1, end).join('\n'));
      lineIdx = end + 1;
    }
  }

  const commit = () => {
    if (current) rawSlides.push(current);
    current = null;
  };

  for (; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx];
    const { inFence, isBoundary } = fence(raw);
    if (inFence || isBoundary) {
      current?.lines.push(raw);
      continue;
    }

    const trimmed = raw.trim();

    // H1 = slide boundary (but not H2+)
    if (!trimmed.startsWith('##')) {
      const h1 = H1_RE.exec(trimmed);
      if (h1) {
        commit();
        current = { heading: h1[1], lines: [] };
        continue;
      }
    }

    // Before first slide = root scope
    if (!current) {
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
      continue; // skip unknown root lines
    }

    current.lines.push(raw);
  }
  commit();

  return { frontmatter, classes, vars, rawSlides };
}
