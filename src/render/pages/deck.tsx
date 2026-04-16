import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import { parseDeck } from '../../parser/index';
import type { Slide } from '../../parser/types';
import { codeToHtml } from '../components/code-block';
import { HeadMeta, type HeadProps } from '../components/head';
import { ogpToHtml } from '../components/link-card';
import { SlideWrapper } from '../components/parts';
import { templates } from '../components/templates';
import type { PageOptions } from '../types';

const HenohenoScript: FC<{ base: string }> = ({ base }) => (
  <script>
    {raw(
      `(async()=>{const s=document.getElementById('henoheno-slot');if(!s)return;const r=await fetch('${base}henoheno.svg');if(!r.ok)return;s.innerHTML=await r.text()})();`,
    )}
  </script>
);

const SlideRenderer: FC<{ slide: Slide }> = ({ slide }) => {
  const entry = templates[slide.template] ?? templates.default;
  const isTitle = slide.template === 'title' || slide.template === 'hero';
  const bg = slide.bg ?? (isTitle ? slide.fbg : undefined);

  return (
    <SlideWrapper
      index={slide.index}
      classes={slide.classes}
      vars={slide.vars}
      templateClass={entry.css}
      bg={bg}
      bgOptions={slide.bgOptions}
      fr={slide.fr}
      fl={slide.fl}
      fbg={slide.fbg}
      fbgOptions={slide.fbgOptions}
    >
      <entry.render heading={slide.heading} sections={slide.sections} />
    </SlideWrapper>
  );
};

export async function deckPage(md: string, deckName: string, opts: PageOptions): Promise<string> {
  const deck = await parseDeck(md, { renderOgp: ogpToHtml, renderCode: codeToHtml });

  const titleSlide = deck.slides.find((s) => s.template === 'title' || s.template === 'hero') ?? deck.slides[0];
  const ogTitle = titleSlide?.heading ?? deckName;
  const subtitle = titleSlide?.sections.find((s) => s.heading)?.heading;
  const subtitleText = subtitle ? renderInline(subtitle).replace(/<[^>]+>/g, '') : '';
  const ogDesc = [subtitleText && `${subtitleText} by へのへのん`, deck.frontmatter.date].filter(Boolean).join(' ');

  const head: HeadProps = {
    title: `${ogTitle} — へのへ Nun`,
    description: ogDesc || undefined,
    ogTitle,
    ogImage: `${opts.site}${opts.base}thumbs/${deckName}.webp`,
    ogUrl: `${opts.site}${opts.base}${deckName}`,
    base: opts.base,
  };

  const page = (
    <html lang="ja">
      <head>
        <HeadMeta {...head} />
        <meta name="view-transition" content="same-document" />
        {opts.cssLinks?.map((href) => <link rel="stylesheet" href={href} />)}
      </head>
      <body>
        {deck.slides.map((slide) => (
          <SlideRenderer slide={slide} />
        ))}
        <div class="cursor-dot" id="cursor-dot" />
        <HenohenoScript base={opts.base} />
        {opts.deckScript && <script type="module" src={opts.deckScript} />}
      </body>
    </html>
  );

  return `<!DOCTYPE html>\n${await page}`;
}
