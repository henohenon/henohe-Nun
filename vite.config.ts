import devServer from '@hono/vite-dev-server';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { ssgPlugin } from './src/ssg';

const BASE = '/henohe-Nun/';
const SITE = 'https://henohenon.github.io';

export default defineConfig({
  base: BASE,
  plugins: [
    UnoCSS(),
    devServer({
      entry: 'src/app.ts',
      exclude: [
        /\/@.+$/, // Vite internals (@vite/client, @fs, etc.)
        /\.\w+$/, // Files with extensions (static assets, client .ts)
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
