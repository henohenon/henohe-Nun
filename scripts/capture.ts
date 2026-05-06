import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  findDecks, ensureBuild, ensureDir, parseArgs,
  startPreview, launchBrowser, openDeck, countSlides, gotoSlide,
} from './_lib.ts'

const args = parseArgs()
const isThumb = args.flags.has('thumb')
const deckFilter = args.values['deck']
const slideFilter = args.values['slide'] ? parseInt(args.values['slide'], 10) : undefined
// `--thumb` 時は OGP 推奨の 1200x630 (1.91:1) をデフォルトに、それ以外は
// 16:9 (1920x1080) のフルスライド。`--width` / `--height` で個別上書き可能。
const width = parseInt(args.values['width'] ?? (isThumb ? '1200' : '1920'), 10)
const height = parseInt(args.values['height'] ?? (isThumb ? '630' : '1080'), 10)
const quality = parseInt(args.values['quality'] ?? (isThumb ? '75' : '85'), 10)

async function main(): Promise<void> {
  await ensureBuild()

  const decks = deckFilter ? [deckFilter] : findDecks()
  if (decks.length === 0) {
    console.error('No decks found in benben/')
    process.exit(1)
  }

  const preview = await startPreview()
  const browser = await launchBrowser()

  try {
    for (const deck of decks) {
      const page = await openDeck(browser, preview.baseUrl, deck, { width, height })
      const total = await countSlides(page)

      const slides = isThumb
        ? [1]
        : slideFilter
          ? [slideFilter]
          : Array.from({ length: total }, (_, i) => i + 1)

      for (const n of slides) {
        await gotoSlide(page, n)
        const png = await page.screenshot({ type: 'png' })
        const webp = await sharp(png).webp({ quality }).toBuffer()

        const outPath = isThumb
          ? join('dist', deck, 'thumb.webp')
          : join('dist', 'captures', deck, `${n}.webp`)
        ensureDir(join(outPath, '..'))
        await writeFile(outPath, webp)
        console.log(`captured ${outPath} (${(webp.byteLength / 1024).toFixed(1)} KB)`)
      }

      await page.close()
    }
  } finally {
    await browser.close()
    await preview.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
