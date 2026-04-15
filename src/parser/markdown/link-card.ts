import type { OgpData } from '../ogp-fetch';
import { escapeHtml } from './code';

function imgClass(ogp: OgpData): 'wide' | 'tall' {
  if (ogp.imageWidth && ogp.imageHeight) {
    return ogp.imageWidth / ogp.imageHeight >= 0.9 ? 'wide' : 'tall';
  }
  return 'wide';
}

export function ogpToHtml(ogp: OgpData, vertical: boolean): string {
  const cls = vertical ? 'link-card link-card-v' : 'link-card';
  const siteLabel = escapeHtml(ogp.siteName || new URL(ogp.url).hostname);

  const imgHtml = ogp.image
    ? `<div class="link-card-img ${imgClass(ogp)}">` +
      `<img src="${escapeHtml(ogp.image)}" alt=""` +
      ` onerror="this.parentElement.style.display='none'">` +
      `</div>`
    : '';

  const faviconHtml = ogp.favicon
    ? `<img class="link-card-favicon" src="${escapeHtml(ogp.favicon)}" alt="" onerror="this.style.display='none'">`
    : '';

  const descHtml = ogp.description
    ? `<div class="link-card-desc">${escapeHtml(ogp.description)}</div>`
    : '<div></div>';

  return [
    `<div class="${cls}">`,
    '<div class="link-card-body">',
    `<div class="link-card-title">${escapeHtml(ogp.title)}</div>`,
    descHtml,
    '<div class="link-card-site">',
    faviconHtml,
    `<span class="link-card-label">${siteLabel}</span>`,
    '</div>',
    '</div>',
    imgHtml,
    `<a href="${escapeHtml(ogp.url)}" target="_blank" rel="noopener noreferrer"></a>`,
    '</div>',
  ].join('');
}
