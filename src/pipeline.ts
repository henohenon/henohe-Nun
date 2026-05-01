import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeNunStructure } from './rehype/nun-structure.ts'

export type ProcessOptions = {
  jsPath: string
}

export function createProcessor(options: ProcessOptions) {
  return unified()
    .use(remarkParse)
    // Phase 5: remarkNunSyntax (micromark extensions)
    // Phase 6: remarkGfm, remarkMath, remarkBreaks, remarkMark
    // Phase 5: remarkNunMeta
    // Phase 5: remarkNunExtract
    .use(remarkRehype)
    // Phase 6: rehypeKatex
    // Phase 8: rehypeNunCodePre
    // Phase 8: rehypeShiki
    // Phase 8: rehypeNunCodeBlock
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
