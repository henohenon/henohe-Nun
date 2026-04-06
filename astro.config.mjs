import { defineConfig } from 'astro/config';
import UnoCSS from '@unocss/astro';

export default defineConfig({
  site: 'https://henohenon.github.io',
  base: '/henohe-Nun/',
  integrations: [UnoCSS({ injectReset: true })],
});
