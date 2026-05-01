import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkNunSyntax } from './remark/nun-syntax.ts'
import { remarkNunMeta } from './remark/nun-meta.ts'
import { remarkNunExtract } from './remark/nun-extract.ts'
import { remarkNunAdmonition } from './remark/nun-admonition.ts'
import { nunHandlers } from './remark/nun-handlers.ts'
import { rehypeNunStructure } from './rehype/nun-structure.ts'

export type ProcessOptions = {
  jsPath: string
}

export function createProcessor(options: ProcessOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkNunSyntax)
    // Phase 6: remarkGfm, remarkMath, remarkBreaks, remarkMark
    .use(remarkNunMeta)
    .use(remarkNunAdmonition)
    .use(remarkNunExtract)
    .use(remarkRehype, { handlers: nunHandlers })
    // Phase 6: rehypeKatex
    // Phase 8: rehypeNunCodePre, rehypeShiki, rehypeNunCodeBlock
    // Phase 5: rehypeNunCard
    // Phase 10: rehypeNunFnRef
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
