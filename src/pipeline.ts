import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import remarkRehype from 'remark-rehype'
import rehypeMathjax from 'rehype-mathjax/svg'
import rehypeStringify from 'rehype-stringify'
import { remarkNunSyntax } from './remark/nun-syntax.ts'
import { remarkNunMeta } from './remark/nun-meta.ts'
import { remarkNunAdmonition } from './remark/nun-admonition.ts'
import { remarkNunExtract } from './remark/nun-extract.ts'
import { nunHandlers } from './remark/nun-handlers.ts'
import { rehypeNunStructure } from './rehype/nun-structure.ts'
import { rehypeNunCodePre, rehypeNunCodeBlock, nunShikiTransformer } from './rehype/code/index.ts'
import { rehypeNunCard } from './rehype/nun-card.ts'
import { rehypeNunFnRef } from './rehype/nun-fn-ref.ts'
import rehypeShiki from '@shikijs/rehype'

export type ProcessOptions = {
  jsPath: string
  /** Vite の `base` (例: `/henohe-Nun/` or `https://example.com/`)。OGP の絶対 URL 組み立てに使う。 */
  base?: string
  /** デッキ名 (例: `sample`)。`{base}{deck}/thumb.webp` 等の URL 組み立てに使う。 */
  deck?: string
}

export function createProcessor(options: ProcessOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkNunSyntax)       // micromark extensions（template, nwyt, admonition tokenizer 前）
    .use(remarkGfm)             // strikethrough, table, checklist, autolink
    .use(remarkMath)            // $...$ / $$...$$
    .use(remarkBreaks)          // 改行 → <br>
    .use(remarkNunMeta)         // ~~~meta → vfile.data.meta
    .use(remarkNunAdmonition)   // :::type → nunAdmonition
    .use(remarkNunExtract)      // template/nwyt prop → vfile.data
    .use(remarkRehype, { handlers: nunHandlers })
    .use(rehypeMathjax)         // 数式 → inline SVG (build 時静的化、 runtime fetch なし)
    .use(rehypeNunCodePre)      // code block pre-processing (diff, embed, name/startLine)
    // dual theme で出力 → CSS var (`--shiki-light` / `--shiki-dark` 等) として
    // 両 theme の色が span 各 token に inline で焼かれる。 `[data-theme="dark"]`
    // 配下では code-block.css で dark 側の var に切替。
    .use(rehypeShiki, {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [nunShikiTransformer],
    })
    .use(rehypeNunCodeBlock)    // code block post-processing (embed, diff classes, figure wrapper)
    .use(rehypeNunCard)          // !card → OGP fetch → card 要素
    .use(rehypeNunFnRef)        // !fn[id] → <sup data-fn="id">
    .use(rehypeNunStructure, {
      jsPath: options.jsPath,
      base: options.base ?? '/',
      deck: options.deck ?? '',
    })
    .use(rehypeStringify)
}

export async function processMarkdown(md: string, options: ProcessOptions): Promise<string> {
  const processor = createProcessor(options)
  const result = await processor.process(md)
  return String(result)
}
