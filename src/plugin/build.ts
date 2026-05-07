import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { UserConfig } from 'vite'
import { processMarkdown } from '../pipeline.ts'
import { findDecks, buildIndex } from './decks.ts'

const JS_PATH = '/src/client/index.ts'

/** Vite の `config` フック: deck 毎の input を rollupOptions に追加 */
export function buildConfig(): UserConfig {
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
}

/** Vite の `resolveId` フック: 仮想 entry (index.html / <deck>/index.html) を 自身で解決 */
export function buildResolveId(id: string): string | undefined {
  if (id === 'index.html' || id.endsWith('/index.html')) {
    return id
  }
}

/**
 * Vite の `load` フック: 仮想 entry の中身を組み立てる。
 * - `index.html` → buildIndex
 * - `<deck>/index.html` → processMarkdown
 *
 * build 時は OGP の og:url / og:image を絶対 URL にするため siteUrl を base に
 * 連結する。 dev / preview の middleware 経路では base 相対のままにするため
 * 別関数 (`renderDeck` for middleware) と分けている。
 */
export async function buildLoad(
  id: string,
  siteUrl: string,
  base: string,
): Promise<string | undefined> {
  if (id === 'index.html') {
    return buildIndex(findDecks())
  }
  const match = id.match(/^(.+)\/index\.html$/)
  if (!match) return
  const deck = match[1]
  const mdPath = resolve('benben', `${deck}.md`)
  if (!existsSync(mdPath)) return
  const md = await readFile(mdPath, 'utf-8')
  return String(await processMarkdown(md, {
    jsPath: JS_PATH,
    base: `${siteUrl}${base}`,
    deck,
  }))
}
