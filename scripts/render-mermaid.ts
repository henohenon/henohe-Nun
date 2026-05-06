import { readFile, writeFile } from 'node:fs/promises'
import { globSync } from 'node:fs'
import { chromium } from 'playwright'

/** dist の各 deck HTML 内の `<pre class="mermaid">…</pre>` を Playwright で
 *  SVG にレンダリングして書き戻す post-build SSG スクリプト。
 *
 *  これにより client-side で mermaid lib を読み込む必要がなくなり、
 *  bundle / modulepreload から mermaid 関連 chunks (≒ 全体の半分以上)
 *  が消える。 */

const HTML_FILES = (globSync('dist/**/index.html') as string[]).filter(
  // dist 直下の決め打ち index (decks list ページ) は対象外
  p => p.replace(/\\/g, '/') !== 'dist/index.html'
)

const PRE_RE = /<pre class="mermaid">([\s\S]*?)<\/pre>/g

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

async function main() {
  if (HTML_FILES.length === 0) {
    console.log('no deck HTML found, skipping mermaid SSG')
    return
  }

  // すべての deck で mermaid ブロックがゼロなら browser を立ち上げない
  const targets: { file: string; html: string; blocks: { match: string; source: string }[] }[] = []
  for (const file of HTML_FILES) {
    const html = await readFile(file, 'utf-8')
    const blocks: { match: string; source: string }[] = []
    let m: RegExpExecArray | null
    PRE_RE.lastIndex = 0
    while ((m = PRE_RE.exec(html)) !== null) {
      blocks.push({ match: m[0], source: decodeEntities(m[1]) })
    }
    if (blocks.length > 0) targets.push({ file, html, blocks })
  }
  if (targets.length === 0) {
    console.log('no mermaid blocks found, skipping')
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent('<!DOCTYPE html><html><head></head><body></body></html>')
  // ローカル node_modules の mermaid を inject (CDN 依存を避ける)
  await page.addScriptTag({ path: 'node_modules/mermaid/dist/mermaid.min.js' })
  await page.evaluate(() => {
    ;(window as any).mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
  })

  let totalRendered = 0
  for (const target of targets) {
    let html = target.html
    for (const block of target.blocks) {
      const svg = await page.evaluate(async (src) => {
        const id = 'mmd-' + Math.random().toString(36).slice(2)
        const result = await (window as any).mermaid.render(id, src)
        return result.svg as string
      }, block.source)
      html = html.replace(block.match, svg)
      totalRendered++
    }
    await writeFile(target.file, html)
    console.log(`rendered ${target.blocks.length} mermaid block(s) in ${target.file}`)
  }

  await browser.close()
  console.log(`total: ${totalRendered} mermaid block(s) across ${targets.length} file(s)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
