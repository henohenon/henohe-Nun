import devServer from '@hono/vite-dev-server';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { ssgPlugin } from './src/render/ssg';

const BASE = '/henohe-Nun/';
const SITE = 'https://henohenon.github.io';

export default defineConfig({
  base: BASE,
  plugins: [
    UnoCSS(),
    devServer({
      entry: 'src/app.ts',
      exclude: [
        /^\/@.+$/, // Vite internals
        /^\/src\/client\/.+$/, // Client entry points (handled by Vite)
        /\.\w+$/, // Files with extensions (static assets)
      ],
    }),
    ssgPlugin({ base: BASE, site: SITE, benbenDir: 'benben' }),
  ],
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});
