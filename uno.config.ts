import { defineConfig, presetWind4 } from 'unocss';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
  presets: [presetWind4()],
  transformers: [transformerDirectives()],
  // Force generation of theme CSS variables used by @apply in stylesheets
  safelist: ['font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'],
  content: {
    filesystem: ['benben/**/*.md', 'src/render/**/*.tsx'],
  },
});
