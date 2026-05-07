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

      // KaTeX 等の webfont は @font-face 宣言時には load 開始されず、
      // 該当 glyph が render された時点で初めて fetch される。 普段は問題ない
      // が、 PDF 出力では section 強制表示の直後に page.pdf() が走るので、
      // hidden section の math 文字に必要なフォントが未 load のまま PDF に
      // 焼かれて 「数字が出ない」 等の症状を起こす。 全 FontFace を明示的に
      // load してから .ready 待ちで取りこぼしを抑える。
      await page.evaluate(async () => {
        if (!('fonts' in document)) return
        const fonts = Array.from((document as Document & { fonts: Set<FontFace> }).fonts)
        await Promise.all(fonts.map(f => f.load().catch(() => {})))
        await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready
      })

      // fbg (footer background image) は screen では `<div class="fbg-layer">` 内
      // `<img>` + `<svg>` + CSS `mask-image: url(#fragment)` で描画される (bg-layer
      // と画像 CSS 共通化、 inspect 容易)。 ただ Chromium PDF backend は CSS
      // mask-image fragment URL も cross-svg `<use href>` も resolve しないため
      // PDF 出力でこの構造をそのまま使うと fbg が真っ黒 / 位置ズレで焼かれる。
      //
      // PDF 専用に DOM を swap して、 redesign/syntax (regenerate 前) と同じ
      // 「単一 SVG + `<clipPath>` + 同一 svg 内に shape 直書き + `<image clip-path>`」
      // 構造に置換する。 CSS 依存をゼロにするため、 clipPath 内 shape の幾何は
      // visible footer 形状の getBoundingClientRect から実 pixel 値で焼き付ける。
      // 設計判断は memory project_fbg_pdf_strategy.md 参照。
      await page.evaluate(() => {
        const NS = 'http://www.w3.org/2000/svg'
        document.querySelectorAll('section').forEach(section => {
          const fbgDiv = section.querySelector(':scope > .fbg-layer')
          if (!fbgDiv || fbgDiv.tagName !== 'DIV') return
          const fbgImg = fbgDiv.querySelector('img.fbg-img') as HTMLImageElement | null
          const src = fbgImg?.getAttribute('src')
          if (!src) return

          const footerSvg = section.querySelector(':scope > footer svg.footer-svg')
          const shapesG = footerSvg?.querySelector('[id^="footer-shapes-"]')
          if (!shapesG) return

          const secRect = section.getBoundingClientRect()
          const newSvg = document.createElementNS(NS, 'svg')
          newSvg.setAttribute('class', 'fbg-layer')
          newSvg.setAttribute('aria-hidden', 'true')
          newSvg.setAttribute('viewBox', `0 0 ${secRect.width} ${secRect.height}`)
          newSvg.setAttribute('preserveAspectRatio', 'xMidYMid slice')

          const defs = document.createElementNS(NS, 'defs')
          const clipPath = document.createElementNS(NS, 'clipPath')
          const clipId = `${shapesG.id}-pdf-clip`
          clipPath.setAttribute('id', clipId)
          clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse')

          Array.from(shapesG.children).forEach(shape => {
            const r = shape.getBoundingClientRect()
            const x = r.x - secRect.x
            const y = r.y - secRect.y
            const tag = shape.tagName.toLowerCase()
            if (tag === 'rect') {
              const rect = document.createElementNS(NS, 'rect')
              rect.setAttribute('x', String(x))
              rect.setAttribute('y', String(y))
              rect.setAttribute('width', String(r.width))
              rect.setAttribute('height', String(r.height))
              clipPath.appendChild(rect)
            } else if (tag === 'text') {
              const cs = window.getComputedStyle(shape)
              const anchor = cs.textAnchor || 'start'
              const tx = anchor === 'end' ? r.right - secRect.x
                : anchor === 'middle' ? (r.left + r.right) / 2 - secRect.x
                : x
              // dominant-baseline: alphabetic で y はおおよそ bbox.bottom (descender 無視)。
              // footer text は日付/タイトル等 ASCII 中心で descender が少ないので近似で許容。
              const ty = r.bottom - secRect.y
              const text = shape.cloneNode(true) as Element
              text.removeAttribute('style')
              text.removeAttribute('transform')
              text.setAttribute('x', String(tx))
              text.setAttribute('y', String(ty))
              text.setAttribute('text-anchor', anchor)
              text.setAttribute('dominant-baseline', 'alphabetic')
              text.setAttribute('font-family', cs.fontFamily)
              text.setAttribute('font-size', cs.fontSize)
              text.setAttribute('font-weight', cs.fontWeight)
              // CSS 由来の translate / transform を打ち消す (SVG attribute 側は除去済みだが
              // CSS rule が再 match しないようにインライン style で完全 override)
              text.setAttribute('style', 'transform: none !important; translate: none !important;')
              clipPath.appendChild(text)
            }
          })

          defs.appendChild(clipPath)
          newSvg.appendChild(defs)

          const image = document.createElementNS(NS, 'image')
          image.setAttribute('href', src)
          image.setAttribute('x', '0')
          image.setAttribute('y', '0')
          image.setAttribute('width', String(secRect.width))
          image.setAttribute('height', String(secRect.height))
          image.setAttribute('preserveAspectRatio', 'xMidYMid slice')
          image.setAttribute('clip-path', `url(#${clipId})`)
          newSvg.appendChild(image)

          fbgDiv.replaceWith(newSvg)
        })
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
