import UnoCSS from '@unocss/astro';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://henohenon.github.io',
  base: '/henohe-Nun/',
  integrations: [UnoCSS({ injectReset: false })],
});
