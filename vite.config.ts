import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import { nunPlugin } from './src/plugin/index.ts'

export default defineConfig({
  server: {
    port: 5175,
  },
  plugins: [
    UnoCSS(),
    nunPlugin(),
  ],
})
