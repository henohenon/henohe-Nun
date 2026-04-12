// Export slides as WebP.
//
// Default: every slide of every deck at 1920x1080, numbered inside a
// per-deck directory (mirrors png.ts, just webp-encoded).
// --thumb:  first slide only at 1200x630 (OGP / index thumbnail size),
//           one file per deck named after the deck slug.
//
// Usage:
//   tsx scripts/webp.ts                     all decks, all slides
//   tsx scripts/webp.ts <deck>              one deck, all slides
//   tsx scripts/webp.ts <deck> 0 3          one deck, pages 0/3 only
//   tsx scripts/webp.ts --thumb             all decks, first slide, OGP size
//   tsx scripts/webp.ts --thumb --out=DIR   custom output dir

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { HEIGHT, openDeckPage, runExport, WIDTH } from './_lib';

const OGP_W = 1200;
const OGP_H = 630;

const argv = process.argv.slice(2);
const isThumb = argv.includes('--thumb');
const outArg = argv.find((a) => a.startsWith('--out='));
const WEBP_DIR = outArg ? outArg.split('=')[1] : isThumb ? 'dist/.thumbs' : 'dist/.webp';

// Positional args after flags: [deck, ...pageIndices]
const positional = argv.filter((a) => !a.startsWith('--'));
const deckArg = positional[0] && !/^\d+$/.test(positional[0]) ? positional[0] : undefined;
const pageArgs = (deckArg ? positional.slice(1) : positional)
  .map((s) => Number.parseInt(s, 10))
  .filter((n) => Number.isFinite(n) && n >= 0);
const pageFilter = pageArgs.length > 0 ? new Set(pageArgs) : null;

try {
  await runExport(
    'webp',
    async (browser, deck) => {
      if (isThumb) {
        const { ctx, page } = await openDeckPage(browser, deck, { width: OGP_W, height: OGP_H });
        const png = await page.screenshot({ fullPage: false, type: 'png' });
        await ctx.close();

        const outPath = join(WEBP_DIR, `${deck}.webp`);
        await mkdir(dirname(outPath), { recursive: true });
        await sharp(png).webp({ quality: 85 }).toFile(outPath);
        console.log(`       → ${outPath}`);
        return;
      }

      const deckDir = join(WEBP_DIR, deck);
      await mkdir(deckDir, { recursive: true });

      const { ctx, page } = await openDeckPage(browser, deck, { width: WIDTH, height: HEIGHT });
      const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
      const pad = String(Math.max(count - 1, 0)).length || 1;

      const pages = pageFilter
        ? [...pageFilter].filter((i) => i < count).sort((a, b) => a - b)
        : Array.from({ length: count }, (_, i) => i);

      for (const i of pages) {
        await page.evaluate((n) => {
          location.hash = String(n);
        }, i);
        await page.waitForTimeout(60);
        const png = await page.screenshot({ fullPage: false, type: 'png' });
        const name = `${String(i).padStart(pad, '0')}.webp`;
        const outPath = join(deckDir, name);
        await sharp(png).webp({ quality: 85 }).toFile(outPath);
        console.log(`       → ${outPath}`);
      }
      await ctx.close();
    },
    { deckFilter: deckArg },
  );
} catch (e) {
  console.error('[webp] fatal:', e);
  process.exit(1);
}
