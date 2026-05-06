import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import { nunPlugin } from './src/plugin/index.ts'

export default defineConfig(({ command }) => ({
  // build 時は絶対 URL にして OGP の og:image / og:url が外部 scraper から
  // 解決可能な形で出力されるようにする (相対パスだと多くの scraper が拾わない)。
  // dev 時はローカルなので相対のまま。
  base: command === 'build' ? 'https://henohenon.github.io/henohe-Nun/' : '/',
  server: {
    port: 5175,
  },
  plugins: [
    UnoCSS(),
    nunPlugin(),
  ],
}))
