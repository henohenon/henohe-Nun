import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { processMarkdown } from '../pipeline.ts'
import { findDecks, buildIndex } from '../decks.ts'

export function nunPlugin(): Plugin {
  // OGP の絶対 URL 組み立てに使う Vite base を `configResolved` で捕捉する
  let base = '/'
  // OGP の og:url / og:image を絶対 URL にするための site origin。
  // `NUN_SITE_URL` (例: `https://henohenon.github.io`) で上書き可。
  // 未設定なら base 相対のまま (scraper が host 解決できない可能性あり)。
  const siteUrl = (process.env.NUN_SITE_URL ?? 'https://henohenon.github.io').replace(/\/$/, '')

  return {
    name: 'nun',

    configResolved(config) {
      base = config.base
    },

    // ----- Build: config + resolveId + load -----

    config() {
      const decks = findDecks()
      return {
        build: {
          rollupOptions: {
            input: {
              index: 'index.html',
              ...Object.fromEntries(decks.map(d => [d, `${d}/index.html`])),
            },
          },
        },
      }
    },

    resolveId(id) {
      if (id === 'index.html' || id.endsWith('/index.html')) {
        return id
      }
    },

    async load(id) {
      if (id === 'index.html') {
        return buildIndex(findDecks())
      }
      const match = id.match(/^(.+)\/index\.html$/)
      if (match) {
        const deck = match[1]
        const mdPath = resolve('benben', `${deck}.md`)
        if (existsSync(mdPath)) {
          const md = await readFile(mdPath, 'utf-8')
          return String(await processMarkdown(md, {
            jsPath: '/src/client/index.ts',
            // build 時のみ siteUrl を付けて OGP の og:url / og:image を絶対 URL に。
            // dev / preview ではローカルでアセットを serve するためパス相対のまま。
            base: `${siteUrl}${base}`,
            deck,
          }))
        }
      }
    },

    // ----- Dev: middleware + HMR -----

    configureServer(server) {
      server.watcher.add('benben')

      server.middlewares.use(async (req, res, next) => {
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
            jsPath: '/src/client/index.ts',
            base,  // dev は localhost で serve するため base のみ (siteUrl 付けない)
            deck: name,
          })
          const html = await server.transformIndexHtml(url, raw)
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }

        next()
      })
    },

    hotUpdate({ file, server }) {
      if (file.endsWith('.md') && file.includes('benben')) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
