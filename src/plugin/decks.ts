import { existsSync, globSync } from 'node:fs'
import { resolve } from 'node:path'

/** benben/ 配下の .md を deck name (拡張子・先頭 benben/ なし) に正規化して返す */
export function findDecks(): string[] {
  return (globSync('benben/**/*.md') as string[])
    .map(p => p.replace(/^benben[\\/]/, '').replace(/\.md$/, '').replace(/\\/g, '/'))
}

/** インデックスページの HTML を生成。
 *  dist/<deck>/slide.pdf があるデッキだけ PDF バッジを付ける。 */
export function buildIndex(deckNames: string[]): string {
  const items = deckNames
    .map(name => {
      const pdfExists = existsSync(resolve('dist', name, 'slide.pdf'))
      const pdf = pdfExists ? ` <a class="pdf" href="./${name}/slide.pdf" download>PDF</a>` : ''
      return `<li><a href="./${name}/">${name}</a>${pdf}</li>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" sizes="32x32" data-anim href="/favicon/wave01.png">
  <link rel="icon" sizes="48x48" href="/favicon/favicon.ico">
  <title>Nun - Decks</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    ul { list-style: none; padding: 0; }
    li { display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    li > a:first-child { flex: 1; font-size: 1.05rem; text-decoration: none; color: #1a1a1a; }
    li > a:first-child:hover { text-decoration: underline; }
    .pdf {
      font-size: 0.75rem; padding: 0.15rem 0.5rem;
      background: #5932ff; color: #fff; border-radius: 4px;
      text-decoration: none;
    }
    .pdf:hover { background: #4520d6; }
  </style>
</head>
<body>
  <h1>Decks</h1>
  <ul>${items}</ul>
  <script type="module" src="/src/client/favicon-anim-entry.ts"></script>
</body>
</html>`
}
