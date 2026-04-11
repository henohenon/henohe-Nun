export interface OgpData {
  title: string;
  description: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  favicon: string | null;
  siteName: string;
  url: string;
}

export async function fetchOgp(url: string): Promise<OgpData | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' }, // 'bot' だと弾くサイトがある
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const base = new URL(url);

    // <meta> 属性を全走査して property/name + content を取る
    const getMeta = (property: string): string => {
      const metaRe = /<meta([^>]+)>/gi;
      let m: RegExpExecArray | null;
      while ((m = metaRe.exec(html)) !== null) {
        const attrs = m[1];
        const prop = /property=["']([^"']*)["']/i.exec(attrs)?.[1] ?? /name=["']([^"']*)["']/i.exec(attrs)?.[1] ?? '';
        if (prop.toLowerCase() !== `og:${property}`) continue;
        const content = /content=["']([^"']*)["']/i.exec(attrs)?.[1];
        if (content !== undefined) return content;
      }
      return '';
    };

    const getFavicon = (): string | null => {
      const linkRe = /<link([^>]+)>/gi;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const attrs = m[1];
        if (!/rel=["'][^"']*icon[^"']*["']/i.test(attrs)) continue;
        const href = /href=["']([^"']*)["']/i.exec(attrs)?.[1];
        if (!href) continue;
        try {
          return new URL(href, base).href;
        } catch {}
      }
      return new URL('/favicon.ico', base).href;
    };

    const title = getMeta('title') || /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || url;

    return {
      title,
      description: getMeta('description'),
      image: getMeta('image'),
      imageWidth: parseInt(getMeta('image:width'), 10) || undefined,
      imageHeight: parseInt(getMeta('image:height'), 10) || undefined,
      favicon: getFavicon(),
      siteName: getMeta('site_name'),
      url,
    };
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 横長(ratio >= 0.9) → contain で全体表示
 * 縦長・正方形(ratio < 0.9) → cover で中央クロップ
 * サイズ不明の場合は wide 扱い（OGP は横長が標準なので）
 */
function imgClass(ogp: OgpData): 'wide' | 'tall' {
  if (ogp.imageWidth && ogp.imageHeight) {
    return ogp.imageWidth / ogp.imageHeight >= 0.9 ? 'wide' : 'tall';
  }
  return 'wide';
}

export function ogpToHtml(ogp: OgpData, vertical: boolean): string {
  const cls = vertical ? 'link-card link-card-v' : 'link-card';
  const siteLabel = esc(ogp.siteName || new URL(ogp.url).hostname);

  const imgHtml = ogp.image
    ? `<div class="link-card-img ${imgClass(ogp)}">` +
      `<img src="${esc(ogp.image)}" alt=""` +
      ` onerror="this.parentElement.style.display='none'">` +
      `</div>`
    : '';

  const faviconHtml = ogp.favicon
    ? `<img class="link-card-favicon" src="${esc(ogp.favicon)}" alt=""` + ` onerror="this.style.display='none'">`
    : '';

  const descHtml = ogp.description ? `<div class="link-card-desc">${esc(ogp.description)}</div>` : '<div></div>'; // grid row を埋めるための空div

  return [
    `<div class="${cls}">`,
    '<div class="link-card-body">',
    `<div class="link-card-title">${esc(ogp.title)}</div>`,
    descHtml,
    '<div class="link-card-site">',
    faviconHtml,
    `<span class="link-card-label">${siteLabel}</span>`,
    '</div>',
    '</div>',
    imgHtml,
    `<a href="${esc(ogp.url)}" target="_blank" rel="noopener noreferrer"></a>`,
    '</div>',
  ].join('');
}
