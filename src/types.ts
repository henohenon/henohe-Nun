import type { Element, ElementContent } from 'hast'
import type { Position } from 'unist'

export type TemplateName = 'default' | 'title' | 'me' | 'message' | 'solo'

export type NwytProp = {
  key: string
  classes: string[]
  rawValue: string
  position: Position
}

export type TemplateEntry = {
  template: TemplateName | undefined
  classes: string[]
  position: Position
}

export type FootnoteEntry = {
  position: Position
}

export type FootnoteLocation = {
  page: number
}

export type VFileData = {
  templates: TemplateEntry[]
  nwyts: NwytProp[]
  footnotes: Record<string, FootnoteEntry>
  footnoteLocs: Record<string, FootnoteLocation>
  meta: Record<string, string>
}

export type Scope = {
  tag: 'section' | 'article'
  depth: number
  heading: Element | null
  template: TemplateName
  classes: string[]
  nwyts: NwytProp[]
  body: (ElementContent | Scope)[]
  fnDef?: string
}

export function isScope(node: ElementContent | Scope): node is Scope {
  return 'tag' in node && 'depth' in node && 'body' in node
}

export function initVFileData(): VFileData {
  return {
    templates: [],
    nwyts: [],
    footnotes: {},
    footnoteLocs: {},
    meta: {},
  }
}
