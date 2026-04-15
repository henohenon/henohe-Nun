// Shared HTML fragment builders for templates

import { renderInline } from '../markdown';

/** Escape HTML entities for safe attribute/text insertion */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Background layer div */
export function bgLayer(src: string, options: string[]): string {
  const classes = ['bg-layer', ...options].join(' ');
  return `<div class="${classes}" style="background-image:url(${src});background-repeat:no-repeat;background-size:contain;background-position:50% 50%"></div>`;
}

/** Convert inline markdown to SVG-safe tspan markup */
function htmlToSvgText(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '<tspan font-weight="900">$1</tspan>')
    .replace(/<b>(.*?)<\/b>/g, '<tspan font-weight="900">$1</tspan>')
    .replace(/<del>(.*?)<\/del>/g, '<tspan style="text-decoration:line-through">$1</tspan>')
    .replace(/<em>(.*?)<\/em>/g, '<tspan font-style="italic">$1</tspan>')
    .replace(/<[^>]+>/g, '');
}

/** Footer SVG layer */
export function footerLayer(
  fr: string | undefined,
  fl: string | undefined,
  fbg: string | undefined,
  fbgOptions: string[],
  slideIndex: number,
): string {
  const flHtml = fl ? renderInline(fl) : '';
  const frHtml = fr ? renderInline(fr) : '';
  if (!flHtml && !frHtml) return '';

  const flSvg = htmlToSvgText(flHtml);
  const frSvg = htmlToSvgText(frHtml);
  const maskId = `footer-mask-${slideIndex}`;

  const svgParts = [
    '<svg class="slide-footer-svg" xmlns="http://www.w3.org/2000/svg">',
    '<defs><mask id="',
    maskId,
    '"><g>',
    '<rect class="footer-svg-line" fill="white" />',
    flSvg ? `<text class="footer-svg-fl" fill="white">${flSvg}</text>` : '',
    frSvg ? `<text class="footer-svg-fr" fill="white">${frSvg}</text>` : '',
    '</g></mask></defs>',
    '<rect class="footer-svg-line" />',
    flSvg ? `<text class="footer-svg-fl">${flSvg}</text>` : '',
    frSvg ? `<text class="footer-svg-fr">${frSvg}</text>` : '',
    '</svg>',
  ];

  let fbgHtml = '';
  if (fbg) {
    const classes = ['bg-layer', ...fbgOptions].join(' ');
    fbgHtml = `<div class="${classes}" style="background-image:url(${fbg});background-repeat:no-repeat;background-size:contain;background-position:50% 50%;z-index:2;pointer-events:none;mask:url(#${maskId})"></div>`;
  }

  return svgParts.join('') + fbgHtml;
}

/** Slide wrapper: <section> with class/var/theme + bg + inner + footer */
export function slideWrapper(opts: {
  index: number;
  classes: string[];
  vars: Record<string, string>;
  bg?: string;
  bgOptions: string[];
  fr?: string;
  fl?: string;
  fbg?: string;
  fbgOptions: string[];
  inner: string;
}): string {
  const varStyle = Object.entries(opts.vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');

  const classAttr = ['slide', ...opts.classes].join(' ');
  const styleAttr = varStyle || undefined;

  const parts = [
    `<section class="${classAttr}" data-index="${opts.index}"${styleAttr ? ` style="${esc(styleAttr)}"` : ''}>`,
    opts.bg ? bgLayer(opts.bg, opts.bgOptions) : '',
    `<div class="slide-inner">${opts.inner}</div>`,
    footerLayer(opts.fr, opts.fl, opts.fbg, opts.fbgOptions, opts.index),
    '</section>',
  ];
  return parts.join('');
}
