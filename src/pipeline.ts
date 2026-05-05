import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { remarkNunSyntax } from './remark/nun-syntax.ts'
import { remarkNunMeta } from './remark/nun-meta.ts'
import { remarkNunAdmonition } from './remark/nun-admonition.ts'
import { remarkNunExtract } from './remark/nun-extract.ts'
import { nunHandlers } from './remark/nun-handlers.ts'
import { rehypeNunStructure } from './rehype/nun-structure.ts'
import { rehypeNunCodePre } from './rehype/nun-code-pre.ts'
import { rehypeNunCodeBlock } from './rehype/nun-code-block.ts'
import { rehypeNunCard } from './rehype/nun-card.ts'
import { rehypeNunFnRef } from './rehype/nun-fn-ref.ts'
import rehypeShiki from '@shikijs/rehype'
import { nunShikiTransformer } from './rehype/nun-shiki-transformer.ts'

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
    .use(rehypeKatex)           // 数式レンダリング
    .use(rehypeNunCodePre)      // code block pre-processing (diff, embed, name/startLine)
    .use(rehypeShiki, { theme: 'github-light', transformers: [nunShikiTransformer] })
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
