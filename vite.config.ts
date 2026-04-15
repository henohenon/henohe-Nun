import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import nunPlugin from './src/vite-plugin-nun';

const BASE = '/henohe-Nun/';
const SITE = 'https://henohenon.github.io';

export default defineConfig({
  base: BASE,
  plugins: [
    UnoCSS(),
    nunPlugin({
      base: BASE,
      site: SITE,
      benbenDir: 'benben',
    }),
  ],
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});
