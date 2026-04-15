import { HeadMeta, type HeadProps } from '../components/head';
import type { PageOptions } from '../types';

export function notFoundPage(opts: PageOptions): string {
  const head: HeadProps = { title: '404 — へのへ Nun', base: opts.base };

  const page = (
    <html lang="ja">
      <head>
        <HeadMeta {...head} />
        {opts.cssLinks?.map((href) => <link rel="stylesheet" href={href} />)}
      </head>
      <body class="m-0 p-0 h-full bg-[var(--base)]">
        <main class="grid place-content-center justify-items-center h-full font-[var(--font-body)] text-[var(--main)]">
          <h1 class="text-24 font-900 m-0 text-[var(--brand)]">404</h1>
          <p class="text-4.5 my-3 mb-6 text-[var(--sub)]">Page was Nun found.</p>
          <a class="text-[var(--brand)] no-underline font-600 hover:underline" href={opts.base}>Back to top</a>
        </main>
      </body>
    </html>
  );

  return `<!DOCTYPE html>\n${page}`;
}
