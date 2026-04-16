// Vite plugin: generate static HTML pages at build time via Hono app

import type { Plugin } from 'vite';
import { createApp } from './app';
import { listDecks } from './render/decks';

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
      // Resolve built JS and CSS asset paths from the bundle
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

      const app = createApp({
        base,
        site,
        assets: {
          deckScript: deckJs || undefined,
          cssLinks: deckCss ? [deckCss] : [],
        },
      });

      const origin = 'http://localhost';

      // Helper: fetch a route from the app and return HTML string
      const fetchHtml = async (path: string) => {
        const res = await app.fetch(new Request(`${origin}${base}${path}`));
        return res.text();
      };

      // Generate deck pages
      const deckNames = listDecks(benbenDir);
      for (const deckName of deckNames) {
        const html = await fetchHtml(deckName);
        this.emitFile({ type: 'asset', fileName: `${deckName}/index.html`, source: html });
      }

      // Generate index page
      const indexHtml = await fetchHtml('');
      if (bundle['index.html']) {
        (bundle['index.html'] as { source: string }).source = indexHtml;
      } else {
        this.emitFile({ type: 'asset', fileName: 'index.html', source: indexHtml });
      }

      // 404 page
      const notFoundHtml = await fetchHtml('404');
      this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundHtml });
    },
  };
}
