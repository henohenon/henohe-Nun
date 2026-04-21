// Render: markdown rendering via marked (with spacer + link-card extensions)

import { type MarkdownRenderers, renderMarkdown } from '../markdown';
import type { OgpData } from '../ogp-fetch';
import type { RawSection } from './build';

export type ResolvedSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  body: string;
};

export function renderSections(
  rawSections: RawSection[],
  ogpMap: Map<string, OgpData | null>,
  renderers: MarkdownRenderers,
): ResolvedSection[] {
  return rawSections.map((s) => {
    const body = renderMarkdown(s.lines.join('\n'), ogpMap, renderers);
    return { heading: s.heading, classes: s.classes, vars: s.vars, body };
  });
}
