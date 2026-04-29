import type { FC, PropsWithChildren } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import type { BgImage } from '../../parser/types';

export const BgLayer: FC<{ bg: BgImage; style?: string }> = ({ bg, style }) => (
  <div
    class={['bg-layer', ...bg.options].join(' ')}
    style={`background-image:url(${bg.src})${style ? `;${style}` : ''}`}
  />
);

function htmlToSvgText(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '<tspan font-weight="900">$1</tspan>')
    .replace(/<b>(.*?)<\/b>/g, '<tspan font-weight="900">$1</tspan>')
    .replace(/<del>(.*?)<\/del>/g, '<tspan style="text-decoration:line-through">$1</tspan>')
    .replace(/<em>(.*?)<\/em>/g, '<tspan font-style="italic">$1</tspan>')
    .replace(/<(?!\/?tspan[\s>])[^>]+>/g, '');
}

export const FooterLayer: FC<{
  fr: string;
  fl: string;
  fbg?: BgImage;
  slideIndex: number;
}> = ({ fr, fl, fbg, slideIndex }) => {
  const flSvg = fl ? htmlToSvgText(renderInline(fl)) : '';
  const frSvg = fr ? htmlToSvgText(renderInline(fr)) : '';
  const clipId = `footer-clip-${slideIndex}`;

  return (
    <svg class="slide-footer-svg" xmlns="http://www.w3.org/2000/svg">
      {fbg && (
        <defs>
          <clipPath id={clipId}>
            <rect class="footer-svg-line" />
            {flSvg && <text class="footer-svg-fl">{raw(flSvg)}</text>}
            {frSvg && <text class="footer-svg-fr">{raw(frSvg)}</text>}
          </clipPath>
        </defs>
      )}
      <rect class="footer-svg-line" />
      {flSvg && <text class="footer-svg-fl">{raw(flSvg)}</text>}
      {frSvg && <text class="footer-svg-fr">{raw(frSvg)}</text>}
      {fbg && <image href={fbg.src} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" clip-path={`url(#${clipId})`} />}
    </svg>
  );
};

type SlideWrapperProps = PropsWithChildren<{
  index: number;
  templateClass: string;
  vars: Record<string, string>;
  bg?: BgImage;
  fr: string;
  fl: string;
  fbg?: BgImage;
}>;

export const SlideWrapper: FC<SlideWrapperProps> = ({
  children,
  index,
  templateClass,
  vars,
  bg,
  fr,
  fl,
  fbg,
}) => {
  const varStyle = Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');

  return (
    <section class="slide" data-index={String(index)}>
      {bg && <BgLayer bg={bg} />}
      <article class={['slide-content', templateClass].join(' ')} style={varStyle || undefined}>{children}</article>
      <FooterLayer fr={fr} fl={fl} fbg={fbg} slideIndex={index} />
    </section>
  );
};