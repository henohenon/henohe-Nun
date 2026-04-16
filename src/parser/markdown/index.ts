import { Marked } from 'marked';
import type { OgpData } from '../ogp-fetch';
import { type OgpRenderer, linkCardExtension, spacerExtension } from './extensions';

export type { OgpRenderer } from './extensions';
export type CodeRenderer = (text: string, lang: string) => string;
export { createFenceTracker } from './fence';

export type MarkdownRenderers = {
  renderOgp: OgpRenderer;
  renderCode: CodeRenderer;
};

function createMarked(ogpMap: Map<string, OgpData | null>, renderers: MarkdownRenderers): Marked {
  return new Marked(
    { gfm: true, breaks: true },
    {
      extensions: [spacerExtension(), linkCardExtension(ogpMap, renderers.renderOgp)],
      renderer: {
        code({ text, lang }) {
          return renderers.renderCode(text, lang ?? '');
        },
      },
    },
  );
}

export function renderMarkdown(
  text: string,
  ogpMap: Map<string, OgpData | null>,
  renderers: MarkdownRenderers,
): string {
  const marked = createMarked(ogpMap, renderers);
  const result = marked.parse(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parse');
  return result;
}

const noopRenderers: MarkdownRenderers = {
  renderOgp: () => '',
  renderCode: () => '',
};

export function renderInline(text: string): string {
  const marked = createMarked(new Map(), noopRenderers);
  const result = marked.parseInline(text);
  if (typeof result !== 'string') throw new Error('marked returned a Promise — expected synchronous parseInline');
  return result;
}
