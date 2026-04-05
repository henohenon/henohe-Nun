import { defineConfig } from 'astro/config';
import UnoCSS from '@unocss/astro';

export default defineConfig({
  integrations: [UnoCSS({ injectReset: true })],
  vite: {
    server: {
      watch: {
        // watch slides.md at project root
        ignored: ['!**/slides.md'],
      },
    },
  },
});
