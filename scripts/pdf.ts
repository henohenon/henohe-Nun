import { writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import {
  findDecks, ensureBuild, ensureDir, parseArgs,
  startPreview, launchBrowser, openDeck,
} from './_lib.ts'

const args = parseArgs()
const deckFilter = args.values['deck']
const width = parseInt(args.values['width'] ?? '1920', 10)
const height = parseInt(args.values['height'] ?? '1080', 10)

async function main(): Promise<void> {
  await ensureBuild()
  await checkMutool()

  const decks = deckFilter ? [deckFilter] : findDecks()

  const preview = await startPreview()
  const browser = await launchBrowser()

  try {
    for (const deck of decks) {
      const page = await openDeck(browser, preview.baseUrl, deck, { width, height })

      // 全 section を強制表示 + page-break で 1 枚 = 1 ページ化
      await page.addStyleTag({
        content: `
          @page { size: ${width}px ${height}px; margin: 0; }
          section {
            display: flex !important;
            opacity: 1 !important;
            page-break-after: always;
            break-after: page;
          }
          section:last-child { page-break-after: auto; break-after: auto; }
        `,
      })

      const pdf = await page.pdf({
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      })

      const outDir = join('dist', deck)
      ensureDir(outDir)
      const rawPath = join(outDir, 'slide.raw.pdf')
      const finalPath = join(outDir, 'slide.pdf')

      await writeFile(rawPath, pdf)
      const before = pdf.byteLength

      // mutool clean -gggg で圧縮 (画像/オブジェクトをまとめて再エンコード)
      await runMutool(['clean', '-gggg', rawPath, finalPath])

      const { statSync, unlinkSync } = await import('node:fs')
      const after = statSync(finalPath).size
      unlinkSync(rawPath)

      console.log(
        `generated ${finalPath} (${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB, ${(100 - after / before * 100).toFixed(1)}% 削減)`,
      )

      await page.close()
    }
  } finally {
    await browser.close()
    await preview.close()
  }
}

async function checkMutool(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('mutool', ['-v'], { stdio: 'ignore', shell: true })
    proc.on('exit', code => {
      if (code === 0 || code === 1) {
        resolve()
      } else {
        reject(new Error(
          'mutool not found. Install MuPDF tools:\n' +
          '  Ubuntu/Debian: sudo apt-get install mupdf-tools\n' +
          '  macOS:         brew install mupdf-tools\n' +
          '  Windows:       https://mupdf.com/releases/',
        ))
      }
    })
    proc.on('error', () => reject(new Error('mutool not found in PATH')))
  })
}

function runMutool(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('mutool', args, { stdio: 'inherit', shell: true })
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`mutool ${args.join(' ')} exited ${code}`)))
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
