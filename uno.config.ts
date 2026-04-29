import { defineConfig, presetWind4 } from 'unocss';
import transformerDirectives from '@unocss/transformer-directives';

/** Extract class names from Nun `.class` syntax (e.g. `.dark.p-8` → ['dark', 'p-8']) */
const nunExtractor = {
  name: 'nun-dot-class' as const,
  order: -1 as const,
  extract({ code }: { code: string }) {
    const classes = new Set<string>();
    // Match .class lines; each segment can include arbitrary-value brackets like [1fr_1fr]
    const seg = /[a-zA-Z][\w/\-]*(?:\[[^\]]*\][\w/\-]*)*/;
    const line = new RegExp(`^\\.(?:${seg.source})(?:\\.(?:${seg.source}))*$`, 'gm');
    for (const m of code.matchAll(line)) {
      // Split on dots NOT inside brackets
      for (const c of m[0].slice(1).match(new RegExp(seg, 'g')) || []) classes.add(c);
    }
    return classes;
  },
};

export default defineConfig({
  presets: [presetWind4()],
  transformers: [transformerDirectives()],
  extractors: [nunExtractor],
  outputToCssLayers: {
    cssLayerName: (layer) => {
      if (layer === 'preflights') return 'base';
      if (layer === 'default') return 'utilities';
      return layer;
    },
  },
  // Force generation of theme CSS variables used by @apply in stylesheets
  safelist: ['font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'],
  content: {
    filesystem: ['benben/**/*.md', 'src/render/**/*.tsx'],
  },
});
