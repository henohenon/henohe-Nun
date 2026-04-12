// Generate PDFs from the current dist/.
// Usage: tsx scripts/pdf.ts [deck] [--no-compress]
//
// Playwright writes the PDF directly; Ghostscript is only used for the
// optional post-pass that re-encodes images at `prepress` quality. If GS
// isn't installed (or --no-compress is passed), the raw Playwright PDF is
// kept as-is.

import { execSync } from 'node:child_process';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { platform } from 'node:os';
import { dirname, join } from 'node:path';
import { HEIGHT, openDeckPage, parseScale, runExport, sh, WIDTH } from './_lib';

const GS = platform() === 'win32' ? 'gswin64c' : 'gs';

const noCompressFlag = process.argv.includes('--no-compress');

// Probe Ghostscript once at startup — missing GS is not fatal, compression
// just gets skipped for the whole run.
function hasGhostscript(): boolean {
  try {
    execSync(`${GS} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const compress = !noCompressFlag && hasGhostscript();
if (noCompressFlag) {
  console.log('[pdf] --no-compress: skipping Ghostscript pass');
} else if (!compress) {
  console.warn(`[pdf] Ghostscript (${GS}) not found — writing uncompressed PDFs. Install it for the prepress compression pass.`);
}

const scale = parseScale();

const PDF_DIR = 'dist/.pdf';

if (scale !== 1) console.log(`[pdf] scale=${scale}`);

const gsMissing = !noCompressFlag && !compress;

try {
  await runExport('pdf', async (browser, deck) => {
    // PDF is vector-based; deviceScaleFactor is not needed. Pass scale only to page.pdf().
    const { ctx, page } = await openDeckPage(browser, deck, { width: WIDTH, height: HEIGHT });
    // Nested decks (`sub/foo`) need their parent dir created too.
    const pdfPath = join(PDF_DIR, `${deck}.pdf`);
    await mkdir(dirname(pdfPath), { recursive: true });
    await page.pdf({
      path: pdfPath,
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      printBackground: true,
      preferCSSPageSize: true,
      scale,
    });

    if (compress) {
      const tmpPath = `${pdfPath}.raw`;
      const before = (await stat(pdfPath)).size;
      await rename(pdfPath, tmpPath);
      await sh(GS, [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.5',
        '-dPDFSETTINGS#/prepress',
        '-dNOPAUSE',
        '-dBATCH',
        `-sOutputFile=${pdfPath}`,
        tmpPath,
      ]);
      const after = (await stat(pdfPath)).size;
      const pct = ((1 - after / before) * 100).toFixed(0);
      await rm(tmpPath);
      console.log(`       → ${pdfPath}  ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB (−${pct}%)`);
    } else {
      const size = (await stat(pdfPath)).size;
      console.log(`       → ${pdfPath}  ${(size / 1e6).toFixed(1)}MB`);
    }
    await ctx.close();
  });

  if (gsMissing) {
    const bar = '='.repeat(72);
    console.warn(`\n${bar}`);
    console.warn(`[pdf] ⚠  Ghostscript (${GS}) was not found on PATH.`);
    console.warn('[pdf]    The PDFs in dist/.pdf/ are the raw Playwright output');
    console.warn('[pdf]    and are NOT compressed. Install Ghostscript and re-run');
    console.warn('[pdf]    `bun run build:pdf` for the prepress compression pass.');
    console.warn(`${bar}\n`);
  }
} catch (e) {
  console.error('[pdf] fatal:', e);
  process.exit(1);
}
