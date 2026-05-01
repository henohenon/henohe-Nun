import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
// TODO: ==highlight== 対応 (remark-mark は unified v11 非対応)
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
import { rehypeNunFnRef } from './rehype/nun-fn-ref.ts'
import rehypeShiki from '@shikijs/rehype'

export type ProcessOptions = {
  jsPath: string
}

export function createProcessor(options: ProcessOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkNunSyntax)       // micromark extensions（template, nwyt, admonition tokenizer 前）
    .use(remarkGfm)             // strikethrough, table, checklist, autolink
    .use(remarkMath)            // $...$ / $$...$$
    .use(remarkBreaks)          // 改行 → <br>
    // TODO: remarkMark (==highlight==)
    .use(remarkNunMeta)         // ~~~meta → vfile.data.meta
    .use(remarkNunAdmonition)   // :::type → nunAdmonition
    .use(remarkNunExtract)      // template/nwyt prop → vfile.data
    .use(remarkRehype, { handlers: nunHandlers })
    .use(rehypeKatex)           // 数式レンダリング
    .use(rehypeNunCodePre)      // code block pre-processing (diff, embed, name/startLine)
    .use(rehypeShiki, { theme: 'nord' })
    .use(rehypeNunCodeBlock)    // code block post-processing (embed, diff classes, figure wrapper)
    // Phase 5: rehypeNunCard
    .use(rehypeNunFnRef)        // !fn[id] → <sup data-fn="id">
    .use(rehypeNunStructure, {
      jsPath: options.jsPath,
    })
    .use(rehypeStringify)
}

export async function processMarkdown(md: string, options: ProcessOptions): Promise<string> {
  const processor = createProcessor(options)
  const result = await processor.process(md)
  return String(result)
}
