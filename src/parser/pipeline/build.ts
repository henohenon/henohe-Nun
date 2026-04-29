// Build: MD string -> DeckTree (frontmatter + classified line tree)
// Headings ##–###### create a nested article tree based on heading level.

import { taggedLines } from '../markdown/fence';
import type { BgImage } from '../types';
import { type LineSyntax, MD_IMG_RE, classifyLine } from '../syntax';

export type RawArticle = {
  heading?: string;
  headingLevel: number;
  template: string;
  classes: string[];
  bodyClasses: string[];
  vars: Record<string, string>;
  lines: string[];
  children: RawArticle[];
  icon?: string;
  iconOptions?: string[];
  caption?: string;
};

export type DeckTreeSlide = {
  articles: RawArticle[];
};

export type DeckTree = {
  frontmatter: Record<string, string>;
  classes: string[];
  vars: Record<string, string>;
  bg?: BgImage;
  fbg?: BgImage;
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

function newArticle(heading: string | undefined, level: number): RawArticle {
  return { heading, headingLevel: level, template: 'default', classes: [], bodyClasses: [], vars: {}, lines: [], children: [] };
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
  let rootBg: BgImage | undefined;
  let rootFbg: BgImage | undefined;
  let rootFr: string | undefined;
  let rootFl: string | undefined;
  const slides: DeckTreeSlide[] = [];
  let slide: DeckTreeSlide | null = null;
  let slideMeta = true;
  let templateSeen = false;
  // Stack tracks nesting: [rootArticle, ##article, ###article, ...]
  let stack: RawArticle[] = [];

  for (const line of classified) {
    // H1 = new slide boundary
    if (line.syntax === 'h1') {
      // Finalize previous slide's root article
      if (slide && !templateSeen) {
        const prevRoot = slide.articles[0];
        prevRoot.bodyClasses.push(...prevRoot.classes);
        prevRoot.classes = [];
      }
      const root = newArticle(line.heading, 1);
      slide = { articles: [root] };
      slides.push(slide);
      stack = [root];
      slideMeta = true;
      templateSeen = false;
      continue;
    }

    // Root scope (before first H1)
    if (!slide) {
      if (line.syntax === 'class') {
        rootClasses.push(...line.classes);
      } else if (line.syntax === 'var') {
        rootVars[line.name] = line.value;
      } else if (line.syntax === 'nwyt') {
        if (line.key === 'fr') rootFr = line.value;
        else if (line.key === 'fl') rootFl = line.value;
        else if (line.key === 'bg' || line.key === 'fbg') {
          const imgMatch = MD_IMG_RE.exec(line.value);
          const src = imgMatch ? imgMatch[2] : line.value;
          const img: BgImage = { src, options: line.options };
          if (line.key === 'bg') rootBg = img;
          else rootFbg = img;
        }
      }
      continue;
    }

    // H2–H6 = new article, nested by heading level
    if (line.syntax === 'h2') {
      const article = newArticle(line.heading || undefined, line.level);

      // Pop stack until top's level is less than new heading's level
      while (stack.length > 1 && stack[stack.length - 1].headingLevel >= line.level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      if (parent.headingLevel <= 1) {
        // Direct child of root → top-level article in slide.articles
        slide.articles.push(article);
      } else {
        // Nested under a higher-level heading
        parent.children.push(article);
      }
      stack.push(article);
      slideMeta = false;
      continue;
    }

    // Slide-level meta (top of slide, before any content) → goes to root article
    if (slideMeta) {
      if (line.syntax === 'blank') continue;
      if (line.syntax === 'class') {
        if (templateSeen) {
          stack[0].bodyClasses.push(...line.classes);
        } else {
          stack[0].classes.push(...line.classes);
        }
        continue;
      }
      if (line.syntax === 'var') {
        stack[0].vars[line.name] = line.value;
        continue;
      }
      if (line.syntax === 'template') {
        stack[0].template = line.name;
        templateSeen = true;
        continue;
      }
      slideMeta = false;
      // fall through to article content
    }

    // Current article = top of stack
    const article = stack[stack.length - 1];

    // Article-level meta (top of article, before any content lines)
    // Classes before template → article classes; after template → body classes
    if (article.lines.length === 0 && line.syntax !== 'fenced') {
      if (line.syntax === 'blank') continue;
      if (line.syntax === 'template') {
        article.template = line.name;
        continue;
      }
      if (line.syntax === 'class') {
        if (article.template !== 'default') {
          article.bodyClasses.push(...line.classes);
        } else {
          article.classes.push(...line.classes);
        }
        continue;
      }
      if (line.syntax === 'var') {
        article.vars[line.name] = line.value;
        continue;
      }
    }

    // Content (including fenced, nwyt, and everything else)
    article.lines.push(line.raw);
  }

  // Finalize last slide's root article
  if (slide && !templateSeen) {
    const lastRoot = slide.articles[0];
    lastRoot.bodyClasses.push(...lastRoot.classes);
    lastRoot.classes = [];
  }

  // Finalize articles: if no template declared, move classes to bodyClasses
  function finalizeArticles(articles: RawArticle[]) {
    for (const a of articles) {
      if (a.template === 'default') {
        a.bodyClasses.push(...a.classes);
        a.classes = [];
      }
      finalizeArticles(a.children);
    }
  }
  // Skip root article (articles[0]) — already finalized above
  for (const s of slides) finalizeArticles(s.articles.slice(1));

  return { frontmatter, classes: rootClasses, vars: rootVars, bg: rootBg, fbg: rootFbg, fr: rootFr, fl: rootFl, slides };
}
