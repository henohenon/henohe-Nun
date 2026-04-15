// HTML page shell builders

import { renderInline } from '../markdown';
import { type HeadOptions, headMeta } from './head';
import { parseDeck, renderSlide } from '../index';
import { esc } from './parts';
import { splitDeck } from '../pipeline/split';

type ShellOptions = {
  base: string;
  site: string;
  /** In dev: "/src/client/deck.ts". In build: resolved asset path */
  deckScript?: string;
  indexScript?: string;
  /** Additional CSS links for build mode */
  cssLinks?: string[];
};

/** Henoheno SVG inline injection script (loads from public/) */
function henohenoScript(base: string): string {
  return `<script>
(async()=>{const s=document.getElementById('henoheno-slot');if(!s)return;
const r=await fetch('${base}henoheno.svg');if(!r.ok)return;
s.innerHTML=await r.text()})();
</script>`;
}

/** Build full deck page HTML */
export async function deckPage(md: string, deckName: string, opts: ShellOptions): Promise<string> {
  const deck = await parseDeck(md);
  const slidesHtml = deck.slides.map((slide) => renderSlide(slide, deck)).join('\n');

  // OG metadata
  const titleSlide = deck.slides.find((s) => s.template === 'title' || s.template === 'hero') ?? deck.slides[0];
  const ogTitle = titleSlide?.heading ?? deckName;
  const subtitle = titleSlide?.sections.find((s) => s.heading)?.heading;
  const subtitleText = subtitle ? renderInline(subtitle).replace(/<[^>]+>/g, '') : '';
  const ogDesc = [subtitleText && `${subtitleText} by へのへのん`, deck.frontmatter.date].filter(Boolean).join(' ');
  const ogUrl = `${opts.site}${opts.base}${deckName}`;
  const thumbUrl = `${opts.site}${opts.base}thumbs/${deckName}.webp`;

  const head: HeadOptions = {
    title: `${ogTitle} — へのへ Nun`,
    description: ogDesc || undefined,
    ogTitle,
    ogImage: thumbUrl,
    ogUrl,
    base: opts.base,
  };

  const scriptTag = opts.deckScript ? `<script type="module" src="${opts.deckScript}"></script>` : '';
  const cssLinks = (opts.cssLinks ?? []).map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
${headMeta(head)}
<meta name="view-transition" content="same-document">
${cssLinks}
</head>
<body>
<div class="stage">
<div class="canvas" id="canvas">
${slidesHtml}
</div>
</div>
<div class="cursor-dot" id="cursor-dot"></div>
${henohenoScript(opts.base)}
${scriptTag}
</body>
</html>`;
}

/** Build index page HTML */
export function indexPage(decks: { name: string; md: string }[], opts: ShellOptions): string {
  const items = decks
    .map(({ name, md }) => {
      const s1 = splitDeck(md);
      const title = s1.rawSlides[0]?.heading ?? name;
      const date = s1.frontmatter.date ?? null;
      return { name, title, date };
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const head: HeadOptions = {
    title: 'へのへ Nun',
    base: opts.base,
  };

  const scriptTag = opts.indexScript ? `<script type="module" src="${opts.indexScript}"></script>` : '';
  const cssLinks = (opts.cssLinks ?? []).map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');

  const listHtml =
    items.length === 0
      ? '<p class="empty">No decks found in <code>benben/</code>.</p>'
      : `<ul class="decks">${items
          .map(
            (d) => `<li><a href="${opts.base}${d.name}#0">
<div class="thumb"><img src="${opts.base}thumbs/${d.name}.webp" alt="${esc(d.title)}"></div>
<div class="info"><span class="title">${esc(d.title)}</span>${d.date ? `<span class="date">${esc(d.date)}</span>` : ''}</div>
</a></li>`,
          )
          .join('\n')}</ul>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
${headMeta(head)}
${cssLinks}
</head>
<body>
<main class="index">
<h1>へのへ Nun</h1>
${listHtml}
</main>
${scriptTag}
<style>
html,body{margin:0;padding:0;background:var(--base);min-height:100%}
.index{max-width:800px;margin:0 auto;padding:64px 32px;font-family:var(--font-body);color:var(--main)}
h1{font-size:32px;margin:0 0 32px}
.decks{list-style:none;padding:0;margin:0;display:grid;gap:20px}
.decks a{display:grid;grid-template-columns:240px 1fr;align-items:center;gap:20px;text-decoration:none;color:inherit;padding:12px;border-radius:10px;transition:background .15s}
.decks a:hover{background:var(--muted)}
.thumb{aspect-ratio:1200/630;overflow:hidden;border-radius:6px;border:1px solid var(--border)}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.info{display:grid;gap:6px;min-width:0}
.title{font-size:20px;font-weight:700;color:var(--main)}
.date{font-size:14px;color:var(--sub)}
.empty{color:var(--sub)}
code{background:var(--muted);padding:2px 6px;border-radius:4px}
</style>
</body>
</html>`;
}

/** Build 404 page HTML */
export function notFoundPage(opts: ShellOptions): string {
  const head: HeadOptions = {
    title: '404 — へのへ Nun',
    base: opts.base,
  };

  const cssLinks = (opts.cssLinks ?? []).map((href) => `<link rel="stylesheet" href="${href}">`).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
${headMeta(head)}
${cssLinks}
</head>
<body>
<main class="not-found">
<h1>404</h1>
<p>Page was Nun found.</p>
<a href="${opts.base}">Back to top</a>
</main>
<style>
html,body{margin:0;padding:0;height:100%;background:var(--base)}
.not-found{display:grid;place-content:center;justify-items:center;height:100%;font-family:var(--font-body);color:var(--main)}
h1{font-size:96px;font-weight:900;margin:0;color:var(--brand)}
p{font-size:18px;margin:12px 0 24px;color:var(--sub)}
a{color:var(--brand);text-decoration:none;font-weight:600}
a:hover{text-decoration:underline}
</style>
</body>
</html>`;
}
