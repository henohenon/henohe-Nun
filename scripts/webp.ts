// Export OGP images as WebP (1200x630) — first slide of each deck.
// Usage: tsx scripts/webp.ts [--out=DIR] [deck]

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { runExport, openDeckPage } from './_lib';

const OGP_W = 1200;
const OGP_H = 630;
const outArg = process.argv.find((a) => a.startsWith('--out='));
const WEBP_DIR = outArg ? outArg.split('=')[1] : 'dist/.webp';

await runExport('webp', async (browser, deck) => {
  await mkdir(WEBP_DIR, { recursive: true });

  const { ctx, page } = await openDeckPage(browser, deck, { width: OGP_W, height: OGP_H });
  const png = await page.screenshot({ fullPage: false, type: 'png' });
  await ctx.close();

  const outPath = join(WEBP_DIR, `${deck}.webp`);
  await sharp(png)
    .webp({ quality: 85 })
    .toFile(outPath);

  console.log(`       → ${outPath}`);
});
