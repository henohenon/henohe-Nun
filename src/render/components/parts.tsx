import type { FC, PropsWithChildren } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';

export const BgLayer: FC<{ src: string; options: string[] }> = ({ src, options }) => (
  <div
    class={['bg-layer', ...options].join(' ')}
    style={`background-image:url(${src});background-repeat:no-repeat;background-size:contain;background-position:50% 50%`}
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
  fbg?: string;
  fbgOptions: string[];
  slideIndex: number;
}> = ({ fr, fl, fbg, fbgOptions, slideIndex }) => {
  const flSvg = fl ? htmlToSvgText(renderInline(fl)) : '';
  const frSvg = fr ? htmlToSvgText(renderInline(fr)) : '';
  const maskId = `footer-mask-${slideIndex}`;

  return (
    <>
      <svg class="slide-footer-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id={maskId}>
            <g>
              <rect class="footer-svg-line" fill="white" />
              {flSvg && <text class="footer-svg-fl" fill="white">{raw(flSvg)}</text>}
              {frSvg && <text class="footer-svg-fr" fill="white">{raw(frSvg)}</text>}
            </g>
          </mask>
        </defs>
        <rect class="footer-svg-line" />
        {flSvg && <text class="footer-svg-fl">{raw(flSvg)}</text>}
        {frSvg && <text class="footer-svg-fr">{raw(frSvg)}</text>}
      </svg>
      {fbg && (
        <div
          class={['bg-layer', ...fbgOptions].join(' ')}
          style={`background-image:url(${fbg});background-repeat:no-repeat;background-size:contain;background-position:50% 50%;z-index:2;pointer-events:none;mask:url(#${maskId})`}
        />
      )}
    </>
  );
};

type SlideWrapperProps = PropsWithChildren<{
  index: number;
  classes: string[];
  vars: Record<string, string>;
  templateClass: string;
  bg?: string;
  bgOptions: string[];
  fr: string;
  fl: string;
  fbg?: string;
  fbgOptions: string[];
}>;

export const SlideWrapper: FC<SlideWrapperProps> = ({
  children,
  index,
  classes,
  vars,
  templateClass,
  bg,
  bgOptions,
  fr,
  fl,
  fbg,
  fbgOptions,
}) => {
  const varStyle = Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');

  return (
    <section class={['slide', ...classes].join(' ')} data-index={String(index)} style={varStyle || undefined}>
      {bg && <BgLayer src={bg} options={bgOptions} />}
      <div class={['slide-content', templateClass].join(' ')}>{children}</div>
      <FooterLayer fr={fr} fl={fl} fbg={fbg} fbgOptions={fbgOptions} slideIndex={index} />
    </section>
  );
};
