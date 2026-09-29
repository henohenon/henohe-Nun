import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import { nunPlugin } from './src/plugin/index.ts'

export default defineConfig(({ command }) => ({
  // base はパスのまま (アセット URL を相対化し、preview/capture をローカルで動かすため)。
  // OGP の og:url / og:image は別経路で `NUN_SITE_URL` を頭につけて絶対化する
  // (`src/plugin/index.ts` 参照)。
  base: command === 'build' ? (process.env.NUN_BASE ?? '/henohe-Nun/') : '/',
  server: {
    port: 5175,
  },
  plugins: [
    UnoCSS(),
    nunPlugin(),
  ],
}))
