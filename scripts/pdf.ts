import { writeFile, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { PDFDocument } from 'pdf-lib'
import {
  findDecks, ensureBuild, ensureDir, parseArgs,
  startPreview, launchBrowser, openDeck,
} from './_lib.ts'
import { buildIndex } from '../src/plugin/decks.ts'

const args = parseArgs()
const deckFilter = args.values['deck']
const width = parseInt(args.values['width'] ?? '1920', 10)
const height = parseInt(args.values['height'] ?? '1080', 10)
const noCompress = args.flags.has('no-compress')

async function main(): Promise<void> {
  await ensureBuild()
  const useMutool = !noCompress && await hasMutool()
  if (!noCompress && !useMutool) {
    console.warn('[warn] mutool not found in PATH. Falling back to pdf-lib (軽量、~10% 削減のみ)。')
    console.warn('       強圧縮したい場合は MuPDF tools を install してください:')
    console.warn('         winget install Artifex.MuPDF.Tools  /  brew install mupdf-tools  /  apt-get install mupdf-tools')
  }

  const decks = deckFilter ? [deckFilter] : findDecks()

  const preview = await startPreview()
  const browser = await launchBrowser()

  try {
    for (const deck of decks) {
      const page = await openDeck(browser, preview.baseUrl, deck, { width, height })

      // 全 section を強制表示 + page-break で 1 枚 = 1 ページ化。
      // CSS の section は display: grid; .active で表示する設計なので、
      // .active 相当の表示状態を再現するため display: grid で上書き。
      // (display: flex にすると grid-template-rows が無視されてレイアウト崩壊)
      await page.addStyleTag({
        content: `
          @page { size: ${width}px ${height}px; margin: 0; }
          section {
            display: grid !important;
            opacity: 1 !important;
            page-break-after: always;
            break-after: page;
          }
          section:last-child { page-break-after: auto; break-after: auto; }
        `,
      })

      const raw = await page.pdf({
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      })

      const outDir = join('dist', deck)
      ensureDir(outDir)
      const finalPath = join(outDir, 'slide.pdf')

      const before = raw.byteLength
      let finalSize = before
      let mode = 'no-compress'

      if (useMutool) {
        const rawPath = join(outDir, 'slide.raw.pdf')
        await writeFile(rawPath, raw)
        await runMutool(['clean', '-gggg', rawPath, finalPath])
        finalSize = (await stat(finalPath)).size
        await unlink(rawPath)
        mode = 'mutool'
      } else if (!noCompress) {
        const doc = await PDFDocument.load(raw)
        const compressed = await doc.save({ useObjectStreams: true })
        await writeFile(finalPath, compressed)
        finalSize = compressed.byteLength
        mode = 'pdf-lib'
      } else {
        await writeFile(finalPath, raw)
      }

      const reduction = ((1 - finalSize / before) * 100).toFixed(1)
      console.log(
        `generated ${finalPath} (${(before / 1024).toFixed(1)} KB → ${(finalSize / 1024).toFixed(1)} KB, ${reduction}% off via ${mode})`,
      )

      await page.close()
    }

    // PDF が生成された (≒ slide.pdf が dist/<deck>/ にある) 状態で
    // インデックスページを再生成し、PDF バッジを反映する
    if (existsSync('dist/index.html')) {
      await writeFile('dist/index.html', buildIndex(findDecks()))
      console.log('rebuilt dist/index.html with PDF badges')
    }
  } finally {
    await browser.close()
    await preview.close()
  }
}

function hasMutool(): Promise<boolean> {
  // shell:true 経由だと cmd の "not recognized" が exit 1 で返り判別不能。
  // shell なしで spawn すれば ENOENT が error イベントに来る。
  return new Promise(resolve => {
    const proc = spawn('mutool', ['-v'], { stdio: 'ignore' })
    proc.on('exit', code => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

function runMutool(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('mutool', args, { stdio: 'inherit' })
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`mutool ${args.join(' ')} exited ${code}`)))
    proc.on('error', err => reject(err))
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
