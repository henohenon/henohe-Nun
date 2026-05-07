/**
 * code-block 関連 rehype plugin / shiki transformer の barrel export。
 *
 * pre.ts → shiki → shiki-transformer.ts → block.ts の 4 段で動く。
 * meta-codec.ts は pre と shiki-transformer を結ぶ単一仕様の encode/decode。
 */

export { rehypeNunCodePre } from './pre.ts'
export { rehypeNunCodeBlock } from './block.ts'
export { nunShikiTransformer } from './shiki-transformer.ts'
