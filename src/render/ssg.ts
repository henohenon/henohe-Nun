// Vite plugin: generate static HTML pages at build time

import type { Plugin } from 'vite';
import { deckPage } from './pages/deck';
import { indexPage } from './pages/index';
import { notFoundPage } from './pages/not-found';
import { listDecks, readDeckMd } from './decks';

export interface SsgOptions {
  base: string;
  site: string;
  benbenDir: string;
}

export function ssgPlugin(options: SsgOptions): Plugin {
  const { base, site, benbenDir } = options;

  return {
    name: 'nun-ssg',
    apply: 'build',

    async generateBundle(_opts, bundle) {
      // Find built JS and CSS assets from the bundle
      let deckJs = '';
      let deckCss = '';
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          deckJs = `${base}${fileName}`;
        }
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          deckCss = `${base}${fileName}`;
        }
      }

      const shellOpts = {
        base,
        site,
        deckScript: deckJs || undefined,
        indexScript: undefined,
        cssLinks: deckCss ? [deckCss] : [],
      };

      const indexShellOpts = {
        ...shellOpts,
        deckScript: undefined,
      };

      // Generate deck pages
      const deckNames = listDecks(benbenDir);
      for (const deckName of deckNames) {
        const md = readDeckMd(benbenDir, deckName);
        if (!md) continue;
        const html = await deckPage(md, deckName, shellOpts);
        this.emitFile({ type: 'asset', fileName: `${deckName}/index.html`, source: html });
      }

      // Generate index page
      const decks = deckNames
        .map((name) => {
          const md = readDeckMd(benbenDir, name);
          return md ? { name, md } : null;
        })
        .filter(Boolean) as { name: string; md: string }[];
      const indexHtml = indexPage(decks, indexShellOpts);

      if (bundle['index.html']) {
        (bundle['index.html'] as { source: string }).source = indexHtml;
      } else {
        this.emitFile({ type: 'asset', fileName: 'index.html', source: indexHtml });
      }

      // 404 page
      this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundPage(indexShellOpts) });
    },
  };
}
