import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import { nunTemplateSyntax, nunTemplateFromMarkdown } from '../micromark/template.ts'
import { nunNwytPropSyntax, nunNwytPropFromMarkdown } from '../micromark/nwyt-prop.ts'
import { nunNwytContentSyntax, nunNwytContentFromMarkdown } from '../micromark/nwyt-content.ts'
import { nunAdmonitionSyntax, nunAdmonitionFromMarkdown } from '../micromark/admonition.ts'

/**
 * remark plugin: micromark extensions を remarkParse に登録する。
 *
 * - 🌊template.class (flow)
 * - !key~value (flow)
 * - !key[value](url) (text)
 * - :::admonition (flow)
 */
export const remarkNunSyntax: Plugin<[], Root> = function () {
  const data = this.data()

  // micromark syntax extensions
  data.micromarkExtensions ??= []
  data.micromarkExtensions.push(nunTemplateSyntax())
  data.micromarkExtensions.push(nunNwytPropSyntax())
  data.micromarkExtensions.push(nunNwytContentSyntax())
  // TODO: admonition micromark extension を修正後に有効化
  // data.micromarkExtensions.push(nunAdmonitionSyntax())

  // mdast-util fromMarkdown extensions
  data.fromMarkdownExtensions ??= []
  data.fromMarkdownExtensions.push(nunTemplateFromMarkdown())
  data.fromMarkdownExtensions.push(nunNwytPropFromMarkdown())
  data.fromMarkdownExtensions.push(nunNwytContentFromMarkdown())
  // data.fromMarkdownExtensions.push(nunAdmonitionFromMarkdown())
}
