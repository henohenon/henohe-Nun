import type { FC } from 'hono/jsx';
import type { OgpData } from '../../parser/ogp-fetch';

function imgClass(ogp: OgpData): string {
  if (ogp.imageWidth && ogp.imageHeight) {
    return ogp.imageWidth / ogp.imageHeight >= 0.9 ? 'link-card-img wide' : 'link-card-img tall';
  }
  return 'link-card-img wide';
}

const LinkCard: FC<{ ogp: OgpData; vertical: boolean }> = ({ ogp, vertical }) => {
  const cls = vertical ? 'link-card link-card-v' : 'link-card';
  const siteLabel = ogp.siteName || new URL(ogp.url).hostname;

  return (
    <div class={cls}>
      <div class="link-card-body">
        <div class="link-card-title">{ogp.title}</div>
        {ogp.description && <div class="link-card-desc">{ogp.description}</div>}
        <div class="link-card-site">
          {ogp.favicon && (
            <img class="link-card-favicon" src={ogp.favicon} alt="" onerror="this.style.display='none'" />
          )}
          <span class="link-card-label">{siteLabel}</span>
        </div>
      </div>
      {ogp.image && (
        <div class={imgClass(ogp)}>
          <img src={ogp.image} alt="" onerror="this.parentElement.style.display='none'" />
        </div>
      )}
      <a href={ogp.url} target="_blank" rel="noopener noreferrer" />
    </div>
  );
};

export function ogpToHtml(ogp: OgpData, vertical: boolean): string {
  return (<LinkCard ogp={ogp} vertical={vertical} />).toString();
}
