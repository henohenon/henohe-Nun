// HTML <head> content generation

import { esc } from './parts';

export type HeadOptions = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  ogUrl?: string;
  base: string;
};

export function headMeta(opts: HeadOptions): string {
  const faviconFrames = [1, 2, 3, 4].map((i) => `'${opts.base}favicon/wave0${i}.png'`).join(',');

  const parts = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(opts.title)}</title>`,
    `<link rel="icon" href="${opts.base}favicon/favicon.ico" id="favicon">`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@100;200;300;400;500;600;700&display=swap">',
  ];

  if (opts.description) {
    parts.push(`<meta name="description" content="${esc(opts.description)}">`);
  }

  if (opts.ogTitle) {
    parts.push(
      `<meta property="og:title" content="${esc(opts.ogTitle)}">`,
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="へのへ Nun">',
      '<meta property="og:locale" content="ja_JP">',
    );
    if (opts.description) parts.push(`<meta property="og:description" content="${esc(opts.description)}">`);
    if (opts.ogUrl) parts.push(`<meta property="og:url" content="${esc(opts.ogUrl)}">`);
    if (opts.ogImage) {
      parts.push(
        `<meta property="og:image" content="${esc(opts.ogImage)}">`,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
      );
    }
    parts.push(
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:site" content="@henohenon_8282">',
      `<meta name="twitter:title" content="${esc(opts.ogTitle)}">`,
    );
    if (opts.description) parts.push(`<meta name="twitter:description" content="${esc(opts.description)}">`);
    if (opts.ogImage) parts.push(`<meta name="twitter:image" content="${esc(opts.ogImage)}">`);
  }

  // Animated favicon
  parts.push(`<script>
let _fi=0;const _ff=[${faviconFrames}],_fl=document.getElementById('favicon');
setInterval(()=>{_fl.href=_ff[_fi];_fi=(_fi+1)%_ff.length},667);
</script>`);

  return parts.join('\n');
}
