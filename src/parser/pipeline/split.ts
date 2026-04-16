// Split: frontmatter extraction + split by H1 + root .class/$var extraction

import { taggedLines } from '../markdown/fence';
import { CLASS_RE, H1_RE, TILDE_RE, VAR_RE, parseClasses, parseTildeOptions } from '../syntax';

export type RawSlide = {
  heading: string;
  lines: string[];
};

export type SplitResult = {
  frontmatter: Record<string, string>;
  classes: string[];
  vars: Record<string, string>;
  fr?: string;
  fl?: string;
  rawSlides: RawSlide[];
};

function parseFrontmatter(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = /^(\w[\w-]*):\s*(.+)$/.exec(line.trim());
    if (m) result[m[1]] = m[2];
  }
  return result;
}

export function splitDeck(md: string): SplitResult {
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  let frontmatter: Record<string, string> = {};
  let startIdx = 0;

  if (lines[0]?.trim() === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) {
      frontmatter = parseFrontmatter(lines.slice(1, end).join('\n'));
      startIdx = end + 1;
    }
  }

  const classes: string[] = [];
  const vars: Record<string, string> = {};
  let fr: string | undefined;
  let fl: string | undefined;
  const rawSlides: RawSlide[] = [];
  let current: RawSlide | null = null;

  for (const { raw, trimmed, fenced } of taggedLines(lines.slice(startIdx))) {
    if (fenced) {
      current?.lines.push(raw);
      continue;
    }

    if (!trimmed.startsWith('##')) {
      const h1 = H1_RE.exec(trimmed);
      if (h1) {
        if (current) rawSlides.push(current);
        current = { heading: h1[1], lines: [] };
        continue;
      }
    }

    if (!current) {
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
      const tm = TILDE_RE.exec(trimmed);
      if (tm) {
        const value = tm[1].trim();
        const { key } = parseTildeOptions(tm[2]);
        if (key === 'fr') fr = value;
        else if (key === 'fl') fl = value;
        continue;
      }
      continue;
    }

    current.lines.push(raw);
  }
  if (current) rawSlides.push(current);

  return { frontmatter, classes, vars, fr, fl, rawSlides };
}
