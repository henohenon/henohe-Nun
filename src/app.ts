// Hono app: serves deck pages in dev via @hono/vite-dev-server

import { Hono } from 'hono';
import { listDecks, readDeckMd } from './render/decks';
import { deckPage } from './render/pages/deck';
import { indexPage } from './render/pages/index';
import { notFoundPage } from './render/pages/not-found';

const BASE = '/henohe-Nun/';
const SITE = 'https://henohenon.github.io';
const BENBEN_DIR = 'benben';

const shellOpts = {
  base: BASE,
  site: SITE,
  deckScript: '/src/client/deck.ts',
  indexScript: '/src/client/index.ts',
};

const app = new Hono().basePath(BASE);

app.get('/', (c) => {
  const deckNames = listDecks(BENBEN_DIR);
  const decks = deckNames
    .map((name) => {
      const md = readDeckMd(BENBEN_DIR, name);
      return md ? { name, md } : null;
    })
    .filter(Boolean) as { name: string; md: string }[];
  return c.html(indexPage(decks, shellOpts));
});

app.get('/:deck{.+}', async (c) => {
  const deckName = c.req.param('deck');
  const md = readDeckMd(BENBEN_DIR, deckName);
  if (!md) {
    return c.html(notFoundPage(shellOpts), 404);
  }
  return c.html(await deckPage(md, deckName, shellOpts));
});

export default app;
