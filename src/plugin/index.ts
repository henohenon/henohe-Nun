import { existsSync, readFileSync } from 'node:fs'
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

    // TODO Phase 12: build hooks (config, resolveId, load)
  }
}

function buildIndex(deckPaths: string[]): string {
  const items = deckPaths
    .map(p => deckName(p))
    .map(name => `<li><a href="/${name}">${name}</a></li>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nun - Decks</title>
</head>
<body>
  <h1>Decks</h1>
  <ul>${items}</ul>
</body>
</html>`
}
