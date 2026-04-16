// Render: markdown rendering via marked (with spacer + link-card extensions)

import { type MarkdownRenderers, renderMarkdown } from '../markdown';
import type { OgpData } from '../ogp-fetch';
import type { RawSection } from './meta';

export type ResolvedSection = {
  heading?: string;
  classes: string[];
  vars: Record<string, string>;
  body: string;
};

function renderSection(
  raw: RawSection,
  ogpMap: Map<string, OgpData | null>,
  renderers: MarkdownRenderers,
): ResolvedSection {
  const body = renderMarkdown(raw.lines.join('\n'), ogpMap, renderers);
  return { heading: raw.heading, classes: raw.classes, vars: raw.vars, body };
}

export function renderSections(
  rawSections: RawSection[],
  ogpMap: Map<string, OgpData | null>,
  renderers: MarkdownRenderers,
): ResolvedSection[] {
  return rawSections.map((s) => renderSection(s, ogpMap, renderers));
}
