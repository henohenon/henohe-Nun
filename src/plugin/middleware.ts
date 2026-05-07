import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Connect, ViteDevServer } from 'vite'
import { processMarkdown } from '../pipeline.ts'
import { findDecks, buildIndex } from './decks.ts'

const JS_PATH = '/src/client/index.ts'

/**
 * dev サーバの middleware を生成する。
 *
 * - `/` or `/index.html` → buildIndex 経由
 * - `/<deck>` (or `/<deck>/`) → processMarkdown で markdown → html
 * - 該当しないパスは next()
 *
 * dev は localhost で serve するため OGP url 用の siteUrl は付けず、 vite の
 * base 相対のまま。 build 経路 (`build.ts:buildLoad`) との対比。
 */
export function createNunMiddleware(
  server: ViteDevServer,
  base: string,
): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? ''

    // /index → インデックスページ
    if (url === '/' || url === '/index.html') {
      const html = buildIndex(findDecks())
      const transformed = await server.transformIndexHtml(url, html)
      res.setHeader('Content-Type', 'text/html')
      res.end(transformed)
      return
    }

    // /<deck-name> → スライドページ
    const name = url.replace(/^\//, '').replace(/\/?(index\.html)?(\?.*)?$/, '')
    if (!name) {
      next()
      return
    }

    const mdPath = resolve('benben', `${name}.md`)
    if (existsSync(mdPath)) {
      const md = await readFile(mdPath, 'utf-8')
      const raw = await processMarkdown(md, {
        jsPath: JS_PATH,
        base,
        deck: name,
      })
      const html = await server.transformIndexHtml(url, raw)
      res.setHeader('Content-Type', 'text/html')
      res.end(html)
      return
    }

    next()
  }
}
