export interface OgpData {
  title: string;
  description: string;
  image: string;
  imageSize: { width: number; height: number } | null;
  siteName: string;
  url: string;
}

export async function fetchOgp(url: string): Promise<OgpData | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'bot' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const get = (property: string): string => {
      const re = new RegExp(
        `<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${property}["']`,
        'i',
      );
      const m = re.exec(html);
      return m?.[1] ?? m?.[2] ?? '';
    };

    const title = get('title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || url;

    const imageWidth = parseInt(get('image:width'));
    const imageHeight = parseInt(get('image:height'));

    return {
      title,
      description: get('description'),
      image: get('image'),
      imageSize: imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : null,
      siteName: get('site_name'),
      url,
    };
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function ogpToHtml(ogp: OgpData, vertical: boolean): string {
  const cls = vertical ? 'link-card link-card-v' : 'link-card';
  const imgHtml = ogp.image ? `<div class="link-card-img" style="background-image:url(${esc(ogp.image)}); ${!vertical && ogp.imageSize ? `width: ${252 / ogp.imageSize.height * ogp.imageSize.width}px;` : ''}"></div>` : '';
  const siteLabel = ogp.siteName || new URL(ogp.url).hostname;
  return [
    `<div class="${cls}">`,
    imgHtml,
    '<div class="link-card-body">',
    `<div class="link-card-title">${esc(ogp.title)}</div>`,
    `<div class="link-card-desc">${esc(ogp.description)}</div>`,
    `<div class="link-card-site">${esc(siteLabel)}</div>`,
    '</div>',
    `<a class="" href="${esc(ogp.url)}" target="_blank" rel="noopener"></a>`,
    '</div>',
  ].join('');
}
