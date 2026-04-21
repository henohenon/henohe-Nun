import { buildDeckTree } from '../../parser/pipeline/build';
import { HeadMeta, type HeadProps } from '../components/head';
import type { PageOptions } from '../types';

export function indexPage(decks: { name: string; md: string }[], opts: PageOptions): string {
  const items = decks
    .map(({ name, md }) => {
      const tree = buildDeckTree(md);
      const title = tree.slides[0]?.heading ?? name;
      const date = tree.frontmatter.date ?? null;
      return { name, title, date };
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const head: HeadProps = { title: 'へのへ Nun', base: opts.base };

  const page = (
    <html lang="ja">
      <head>
        <HeadMeta {...head} />
        {opts.cssLinks?.map((href) => <link rel="stylesheet" href={href} />)}
      </head>
      <body class="m-0 p-0 min-h-full bg-[var(--base)]">
        <main class="max-w-800px mx-auto px-4 sm:px-8 py-16 font-[var(--font-body)] text-[var(--main)]">
          <h1 class="text-8 m-0 mb-8">へのへ Nun</h1>
          {items.length === 0 ? (
            <p class="text-[var(--sub)]">
              No decks found in <code class="bg-[var(--muted)] px-1.5 py-0.5 rounded">benben/</code>.
            </p>
          ) : (
            <ul class="list-none p-0 m-0 grid gap-5">
              {items.map((d) => (
                <li>
                  <a
                    href={`${opts.base}${d.name}#0`}
                    class="grid grid-cols-1 sm:grid-cols-[240px_1fr] items-center gap-3 sm:gap-5 no-underline color-inherit p-3 rounded-2.5 transition-colors hover:bg-[var(--muted)]"
                  >
                    <div class="aspect-[1200/630] overflow-hidden rounded-1.5 border border-solid border-[var(--border)]">
                      <img class="w-full h-full object-cover block" src={`${opts.base}thumbs/${d.name}.webp`} alt={d.title} />
                    </div>
                    <div class="grid gap-1.5 min-w-0">
                      <span class="text-5 font-700 text-[var(--main)]">{d.title}</span>
                      {d.date && <span class="text-3.5 text-[var(--sub)]">{d.date}</span>}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>
        {opts.indexScript && <script type="module" src={opts.indexScript} />}
      </body>
    </html>
  );

  return `<!DOCTYPE html>\n${page}`;
}
