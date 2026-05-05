import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { globSync } from 'node:fs'
import type { Plugin } from 'vite'
import { processMarkdown } from '../pipeline.ts'

/** 'benben/2024/deck.md' → '2024/deck' */
function deckName(mdPath: string): string {
  return mdPath.replace(/^benben[\\/]/, '').replace(/\.md$/, '')
}

/** benben/ 配下の .md ファイルを glob で取得 */
function findDecks(): string[] {
  return globSync('benben/**/*.md', { withFileTypes: false }) as unknown as string[]
}

export function nunPlugin(): Plugin {
  return {
    name: 'nun',

    // ----- Build: config + resolveId + load -----

    config() {
      const decks = findDecks().map(deckName)
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
        const mdPath = resolve('benben', `${match[1]}.md`)
        if (existsSync(mdPath)) {
          const md = await readFile(mdPath, 'utf-8')
          return String(await processMarkdown(md, {
            jsPath: '/src/client/index.ts',
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

function buildIndex(deckPaths: string[]): string {
  const items = deckPaths
    .map(p => deckName(p))
    .map(name => {
      const pdfExists = existsSync(resolve('dist', name, 'slide.pdf'))
      const pdf = pdfExists ? ` <a class="pdf" href="./${name}/slide.pdf" download>PDF</a>` : ''
      return `<li><a href="./${name}/">${name}</a>${pdf}</li>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nun - Decks</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    ul { list-style: none; padding: 0; }
    li { display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    li > a:first-child { flex: 1; font-size: 1.05rem; text-decoration: none; color: #1a1a1a; }
    li > a:first-child:hover { text-decoration: underline; }
    .pdf {
      font-size: 0.75rem; padding: 0.15rem 0.5rem;
      background: #5932ff; color: #fff; border-radius: 4px;
      text-decoration: none;
    }
    .pdf:hover { background: #4520d6; }
  </style>
</head>
<body>
  <h1>Decks</h1>
  <ul>${items}</ul>
</body>
</html>`
}
