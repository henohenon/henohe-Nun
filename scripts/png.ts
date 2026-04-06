// Export slides as PNGs at 1920x1080.
//
// Usage:
//   dist/.png                   all decks, all slides
//   dist/.png <deck>            one deck, all slides
//   dist/.png <deck> 0 3 5      one deck, pages 0/3/5 only

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runExport, openDeckPage, WIDTH, HEIGHT, parseScale } from './_lib';

const scale = parseScale();

const PNG_DIR = 'dist/.png';

// Parse page indices from argv (everything after the optional deck name).
const args = process.argv.slice(2);
const deckArg = args[0] && !/^\d+$/.test(args[0]) ? args[0] : undefined;
const pageArgs = (deckArg ? args.slice(1) : args)
  .map((s) => Number.parseInt(s, 10))
  .filter((n) => Number.isFinite(n) && n >= 0);
const pageFilter = pageArgs.length > 0 ? new Set(pageArgs) : null;

// Override deckArg into argv[2] so runExport picks it up.
if (deckArg) process.argv[2] = deckArg;
else process.argv.length = 2;

if (scale !== 1) console.log(`[png] scale=${scale} → ${WIDTH * scale}×${HEIGHT * scale}`);

await runExport('png', async (browser, deck) => {
  const deckDir = join(PNG_DIR, deck);
  await mkdir(deckDir, { recursive: true });

  const { ctx, page } = await openDeckPage(browser, deck, { width: WIDTH, height: HEIGHT }, scale);
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const pad = String(Math.max(count - 1, 0)).length || 1;

  const pages = pageFilter
    ? [...pageFilter].filter((i) => i < count).sort((a, b) => a - b)
    : Array.from({ length: count }, (_, i) => i);

  for (const i of pages) {
    await page.evaluate((n) => { location.hash = String(n); }, i);
    await page.waitForTimeout(60);
    const name = String(i).padStart(pad, '0') + '.png';
    await page.screenshot({ path: join(deckDir, name), fullPage: false });
    console.log(`       → dist/.png/${deck}/${name}`);
  }
  await ctx.close();
});
