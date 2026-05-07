import type { Plugin } from 'vite'
import { buildConfig, buildResolveId, buildLoad } from './build.ts'
import { createNunMiddleware } from './middleware.ts'

/**
 * Nun の Vite plugin。 build 経路 (config / resolveId / load) と
 * dev 経路 (configureServer / hotUpdate) を assemble する。
 *
 * `siteUrl` (`NUN_SITE_URL` env) は OGP の og:url / og:image を絶対 URL にする
 * ためにのみ build 時に使われる。 dev / preview では base 相対のまま。
 */
export function nunPlugin(): Plugin {
  // OGP 絶対 URL 組み立て用に Vite の base を `configResolved` で捕捉する
  let base = '/'
  const siteUrl = (process.env.NUN_SITE_URL ?? 'https://henohenon.github.io').replace(/\/$/, '')

  return {
    name: 'nun',

    configResolved(config) {
      base = config.base
    },

    // ----- Build: config + resolveId + load -----

    config: buildConfig,
    resolveId: buildResolveId,
    async load(id) {
      return buildLoad(id, siteUrl, base)
    },

    // ----- Dev: middleware + HMR -----

    configureServer(server) {
      server.watcher.add('benben')
      server.middlewares.use(createNunMiddleware(server, base))
    },

    hotUpdate({ file, server }) {
      if (file.endsWith('.md') && file.includes('benben')) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
