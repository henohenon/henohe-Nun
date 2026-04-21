// Hono app: serves deck pages in dev and SSG build

import { Hono } from 'hono';
import { listDecks, readDeckMd } from './render/decks';
import { deckPage } from './render/pages/deck';
import { indexPage } from './render/pages/index';
import { notFoundPage } from './render/pages/not-found';
import type { PageOptions } from './render/types';

const BENBEN_DIR = 'benben';

export type AppOptions = {
  base: string;
  site: string;
  assets?: { deckScript?: string; cssLinks?: string[] };
};

export function createApp(opts: AppOptions) {
  const { base, site, assets } = opts;

  const shellOpts: PageOptions = {
    base,
    site,
    deckScript: assets?.deckScript ?? `${base}src/client/deck/index.ts`,
    indexScript: assets ? undefined : `${base}src/client/index.ts`,
    cssLinks: assets?.cssLinks,
  };

  const indexShellOpts: PageOptions = {
    ...shellOpts,
    deckScript: undefined,
  };

  const app = new Hono().basePath(base);

  app.get('/', (c) => {
    const deckNames = listDecks(BENBEN_DIR);
    const decks = deckNames
      .map((name) => {
        const md = readDeckMd(BENBEN_DIR, name);
        return md ? { name, md } : null;
      })
      .filter(Boolean) as { name: string; md: string }[];
    return c.html(indexPage(decks, indexShellOpts));
  });

  app.get('/404', (c) => c.html(notFoundPage(indexShellOpts), 404));

  app.get('/:deck{.+}', async (c) => {
    const deckName = c.req.param('deck');
    const md = readDeckMd(BENBEN_DIR, deckName);
    if (!md) {
      return c.html(notFoundPage(indexShellOpts), 404);
    }
    return c.html(await deckPage(md, deckName, shellOpts));
  });

  return app;
}

// Dev server entry (used by @hono/vite-dev-server)
import { BASE, SITE } from './site';

export default createApp({ base: BASE, site: SITE });
