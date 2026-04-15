// Vite plugin for henohe-Nun: serves deck pages in dev, generates static HTML in build

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export interface NunPluginOptions {
  base: string;
  site: string;
  benbenDir: string;
}

/** Recursively list .md files under a directory, returning relative paths without .md */
function listDecks(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listDecks(join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.md')) {
      out.push(rel.replace(/\.md$/, ''));
    }
  }
  return out.sort();
}

function readDeckMd(benbenDir: string, deckName: string): string | null {
  const path = join(benbenDir, `${deckName}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

export default function nunPlugin(options: NunPluginOptions): Plugin {
  const { base, site, benbenDir } = options;
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-nun',

    configResolved(resolved) {
      config = resolved;
    },

    // Dev server: serve generated HTML for all routes
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';
        // Strip base prefix
        let pathname = url.split('?')[0].split('#')[0];
        if (pathname.startsWith(base)) {
          pathname = pathname.slice(base.length);
        }
        // Remove trailing slash
        if (pathname.endsWith('/') && pathname.length > 1) {
          pathname = pathname.slice(0, -1);
        }

        // Lazy import to avoid top-level await issues
        const { deckPage, indexPage, notFoundPage } = await import('./parser/html/shell.js');

        // In dev, Vite's transformIndexHtml rewrites absolute URLs by
        // prepending base, so we use paths WITHOUT the base prefix and
        // inject the HMR client ourselves.
        const hmrClient = `<script type="module" src="${base}@vite/client"></script>`;
        const shellOpts = {
          base,
          site,
          deckScript: `${base}src/client/deck.ts`,
          indexScript: `${base}src/client/index.ts`,
        };

        try {
          let html: string;

          if (pathname === '' || pathname === '/') {
            // Index page
            const deckNames = listDecks(benbenDir);
            const decks = deckNames
              .map((name) => {
                const md = readDeckMd(benbenDir, name);
                return md ? { name, md } : null;
              })
              .filter(Boolean) as { name: string; md: string }[];
            html = indexPage(decks, shellOpts);
          } else {
            // Deck page
            const deckName = pathname.startsWith('/') ? pathname.slice(1) : pathname;
            const md = readDeckMd(benbenDir, deckName);
            if (!md) {
              // Not a deck route, let Vite handle it
              return next();
            }
            html = await deckPage(md, deckName, shellOpts);
          }

          // Inject HMR client (we skip transformIndexHtml to avoid URL doubling)
          html = html.replace('<head>', `<head>\n${hmrClient}`);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (err) {
          console.error('[nun]', err);
          next(err);
        }
      });
    },

    // Build: generate static HTML files
    async generateBundle(_options, bundle) {
      const { deckPage, indexPage, notFoundPage } = await import('./parser/html/shell.js');

      // Find built JS and CSS assets from the bundle.
      // The entry HTML (index.html) references src/client/deck.ts, so
      // Vite produces one entry chunk and one (or more) CSS assets.
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
        indexScript: undefined, // index page doesn't need JS
        cssLinks: deckCss ? [deckCss] : [],
      };

      const indexShellOpts = {
        ...shellOpts,
        deckScript: undefined,
        cssLinks: deckCss ? [deckCss] : [],
      };

      // Generate deck pages
      const deckNames = listDecks(benbenDir);
      for (const deckName of deckNames) {
        const md = readDeckMd(benbenDir, deckName);
        if (!md) continue;
        const html = await deckPage(md, deckName, shellOpts);
        this.emitFile({
          type: 'asset',
          fileName: `${deckName}/index.html`,
          source: html,
        });
      }

      // Generate index page
      const decks = deckNames
        .map((name) => {
          const md = readDeckMd(benbenDir, name);
          return md ? { name, md } : null;
        })
        .filter(Boolean) as { name: string; md: string }[];
      const indexHtml = indexPage(decks, indexShellOpts);

      // Replace the stub index.html with real content
      if (bundle['index.html']) {
        (bundle['index.html'] as { source: string }).source = indexHtml;
      } else {
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: indexHtml,
        });
      }

      // 404 page
      const html404 = notFoundPage(indexShellOpts);
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: html404,
      });
    },
  };
}
