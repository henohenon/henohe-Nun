// Eager-import all images under src/assets/images/ so we can look them up
// by the path used in slide markdown (e.g. `/images/template/tgs.png`).

import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>('../assets/images/**/*.{png,jpg,jpeg,svg,gif,webp,avif}', {
  eager: true,
});

// Build a lookup: `/images/foo.png` → ImageMetadata
const imageMap = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries(modules)) {
  // key is like `../assets/images/template/tgs.png`
  // normalise to `/images/template/tgs.png`
  const normalized = key.replace('../assets/images/', '/images/');
  imageMap.set(normalized, mod.default);
}

export function resolveImage(src: string): ImageMetadata | undefined {
  return imageMap.get(src);
}
