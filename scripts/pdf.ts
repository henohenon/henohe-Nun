// Generate PDFs from the current dist/.
// Usage: tsx scripts/pdf.ts [deck]

import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { platform } from 'node:os';
import { execSync } from 'node:child_process';
import { runExport, openDeckPage, WIDTH, HEIGHT, parseScale, sh } from './_lib';

const GS = platform() === 'win32' ? 'gswin64c' : 'gs';

// Verify Ghostscript is installed before doing any work.
try {
  execSync(`${GS} --version`, { stdio: 'ignore' });
} catch {
  console.error(`[pdf] error: Ghostscript (${GS}) not found. Install it to enable PDF compression.`);
  process.exit(1);
}

const scale = parseScale();

const PDF_DIR = 'dist/.pdf';

if (scale !== 1) console.log(`[pdf] scale=${scale}`);

try {
  await runExport('pdf', async (browser, deck) => {
    // PDF is vector-based; deviceScaleFactor is not needed. Pass scale only to page.pdf().
    const { ctx, page } = await openDeckPage(browser, deck, { width: WIDTH, height: HEIGHT });
    await mkdir(PDF_DIR, { recursive: true });
    const pdfPath = join(PDF_DIR, `${deck}.pdf`);
    await page.pdf({
      path: pdfPath,
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      printBackground: true,
      preferCSSPageSize: true,
      scale,
    });
    const tmpPath = join(PDF_DIR, `${deck}_raw.pdf`);
    const before = (await stat(pdfPath)).size;
    await rename(pdfPath, tmpPath);
    await sh(GS, [
      '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS#/prepress',
      '-dNOPAUSE', '-dBATCH', `-sOutputFile=${pdfPath}`, tmpPath,
    ]);
    const after = (await stat(pdfPath)).size;
    const pct = ((1 - after / before) * 100).toFixed(0);
    await rm(tmpPath);
    console.log(`       → dist/.pdf/${deck}.pdf  ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB (−${pct}%)`);
    await ctx.close();
  });
} catch (e) {
  console.error('[pdf] fatal:', e);
  process.exit(1);
}
