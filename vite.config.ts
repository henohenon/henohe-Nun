import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import { nunPlugin } from './src/plugin/index.ts'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/henohe-Nun/' : '/',
  server: {
    port: 5175,
  },
  plugins: [
    UnoCSS(),
    nunPlugin(),
  ],
}))
