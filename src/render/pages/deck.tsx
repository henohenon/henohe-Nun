import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import { renderInline } from '../../parser/markdown';
import { parseDeck } from '../../parser/index';
import type { Deck, Slide } from '../../parser/types';
import { codeToHtml } from '../components/code-block';
import { HeadMeta, type HeadProps } from '../components/head';
import { ogpToHtml } from '../components/link-card';
import { SlideWrapper } from '../components/parts';
import { templateCSS, renderArticles } from '../components/templates';
import type { PageOptions } from '../types';

const HenohenoScript: FC<{ base: string }> = ({ base }) => (
  <script>
    {raw(
      `(async()=>{const s=document.getElementById('henoheno-slot');if(!s)return;const r=await fetch('${base}henoheno.svg');if(!r.ok)return;s.innerHTML=await r.text()})();`,
    )}
  </script>
);

const SlideRenderer: FC<{ slide: Slide; index: number; deck: Deck }> = ({ slide, index, deck }) => {
  const root = slide.articles[0];
  const template = root?.template ?? 'default';
  const isTitle = template === 'title';

  // Merge settings with defaults
  const slideBg = slide.settings.bg ?? deck.defaults.bg;
  const slideFbg = slide.settings.fbg ?? deck.defaults.fbg;
  const bg = slideBg ?? (isTitle ? slideFbg : undefined);
  const fbg = slideFbg;
  const fr = slide.settings.fr ?? deck.defaults.fr ?? '';
  const fl = slide.settings.fl ?? deck.defaults.fl ?? '';

  const cssClass = templateCSS[template] ?? templateCSS.default;

  return (
    <SlideWrapper
      index={index}
      templateClass={cssClass}
      vars={deck.vars}
      bg={bg}
      fr={fr}
      fl={fl}
      fbg={fbg}
    >
      {renderArticles(slide.articles)}
    </SlideWrapper>
  );
};

export async function deckPage(md: string, deckName: string, opts: PageOptions): Promise<string> {
  const deck = await parseDeck(md, { renderOgp: ogpToHtml, renderCode: codeToHtml });

  const titleSlide = deck.slides.find((s) => s.articles[0]?.template === 'title') ?? deck.slides[0];
  const ogTitle = titleSlide?.articles[0]?.heading ?? deckName;
  const subtitle = titleSlide?.articles.find((a) => a.heading && a.headingLevel > 1)?.heading;
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
        {deck.slides.map((slide, i) => (
          <SlideRenderer slide={slide} index={i} deck={deck} />
        ))}
        <div class="cursor-dot" id="cursor-dot" />
        <HenohenoScript base={opts.base} />
        {opts.deckScript && <script type="module" src={opts.deckScript} />}
      </body>
    </html>
  );

  return `<!DOCTYPE html>\n${await page}`;
}
