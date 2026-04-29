// Render: markdown rendering via marked (with spacer + link-card extensions)
// Recursively renders article children.

import { type MarkdownRenderers, renderMarkdown } from '../markdown';
import type { OgpData } from '../ogp-fetch';
import type { RawArticle } from './build';

export type ResolvedArticle = {
  heading?: string;
  headingLevel: number;
  template: string;
  classes: string[];
  bodyClasses: string[];
  vars: Record<string, string>;
  body: string;
  children: ResolvedArticle[];
  icon?: string;
  iconOptions?: string[];
  caption?: string;
};

export function renderArticles(
  rawArticles: RawArticle[],
  ogpMap: Map<string, OgpData | null>,
  renderers: MarkdownRenderers,
): ResolvedArticle[] {
  return rawArticles.map((a) => {
    const body = renderMarkdown(a.lines.join('\n'), ogpMap, renderers);
    const children = renderArticles(a.children, ogpMap, renderers);
    return { heading: a.heading, headingLevel: a.headingLevel, template: a.template, classes: a.classes, bodyClasses: a.bodyClasses, vars: a.vars, body, children, icon: a.icon, iconOptions: a.iconOptions, caption: a.caption };
  });
}
