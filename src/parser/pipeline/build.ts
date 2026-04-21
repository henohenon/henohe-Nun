// Build: MD string -> DeckTree (frontmatter + classified line tree)
// Replaces split.ts + meta.ts's extractSlideMeta + splitSections in a single pass.

import { taggedLines } from '../markdown/fence';
import { type LineSyntax, classifyLine } from '../syntax';

export type RawSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  lines: string[];
};

export type DeckTreeSlide = {
  heading: string;
  classes: string[];
  vars: Record<string, string>;
  template: string;
  sections: RawSection[];
};

export type DeckTree = {
  frontmatter: Record<string, string>;
  classes: string[];
  vars: Record<string, string>;
  fr?: string;
  fl?: string;
  slides: DeckTreeSlide[];
};

// --- Frontmatter ---

function parseFrontmatter(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = /^(\w[\w-]*):\s*(.+)$/.exec(line.trim());
    if (m) result[m[1]] = m[2];
  }
  return result;
}

// --- Line classification with fence awareness ---

function classifyAll(lines: string[]): LineSyntax[] {
  return Array.from(taggedLines(lines)).map(({ raw, trimmed, fenced }) =>
    fenced ? ({ syntax: 'fenced', raw } as const) : classifyLine(trimmed, raw),
  );
}

// --- Tree builder ---

export function buildDeckTree(md: string): DeckTree {
  const rawLines = md.replace(/\r\n/g, '\n').split('\n');

  // 1. Extract frontmatter
  let frontmatter: Record<string, string> = {};
  let startIdx = 0;
  if (rawLines[0]?.trim() === '---') {
    const end = rawLines.indexOf('---', 1);
    if (end > 0) {
      frontmatter = parseFrontmatter(rawLines.slice(1, end).join('\n'));
      startIdx = end + 1;
    }
  }

  // 2. Classify remaining lines
  const classified = classifyAll(rawLines.slice(startIdx));

  // 3. Build tree in a single scan
  const rootClasses: string[] = [];
  const rootVars: Record<string, string> = {};
  let rootFr: string | undefined;
  let rootFl: string | undefined;
  const slides: DeckTreeSlide[] = [];
  let slide: DeckTreeSlide | null = null;
  let slideMeta = true; // accepting slide-level meta declarations

  for (const line of classified) {
    // H1 = new slide boundary
    if (line.syntax === 'h1') {
      slide = {
        heading: line.heading,
        classes: [],
        vars: {},
        template: 'default',
        sections: [{ classes: [], vars: {}, lines: [] }],
      };
      slides.push(slide);
      slideMeta = true;
      continue;
    }

    // Root scope (before first H1)
    if (!slide) {
      if (line.syntax === 'class') {
        rootClasses.push(...line.classes);
      } else if (line.syntax === 'var') {
        rootVars[line.name] = line.value;
      } else if (line.syntax === 'tilde') {
        if (line.key === 'fr') rootFr = line.value;
        else if (line.key === 'fl') rootFl = line.value;
      }
      continue;
    }

    // H2 = new section within current slide
    if (line.syntax === 'h2') {
      slide.sections.push({
        heading: line.heading || undefined,
        classes: [],
        vars: {},
        lines: [],
      });
      slideMeta = false;
      continue;
    }

    // Slide-level meta (top of slide, before any content)
    if (slideMeta) {
      if (line.syntax === 'blank') continue;
      if (line.syntax === 'class') {
        slide.classes.push(...line.classes);
        continue;
      }
      if (line.syntax === 'var') {
        slide.vars[line.name] = line.value;
        continue;
      }
      if (line.syntax === 'template') {
        slide.template = line.name;
        continue;
      }
      slideMeta = false;
      // fall through to section content
    }

    // Section-level meta (top of section, before any content lines)
    const section = slide.sections[slide.sections.length - 1];
    if (section.lines.length === 0 && line.syntax !== 'fenced') {
      if (line.syntax === 'blank') continue;
      if (line.syntax === 'class') {
        section.classes.push(...line.classes);
        continue;
      }
      if (line.syntax === 'var') {
        section.vars[line.name] = line.value;
        continue;
      }
    }

    // Content (including fenced, tilde, and everything else)
    section.lines.push(line.raw);
  }

  return { frontmatter, classes: rootClasses, vars: rootVars, fr: rootFr, fl: rootFl, slides };
}
