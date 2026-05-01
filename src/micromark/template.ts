import type {
  Code,
  Construct,
  Effects,
  Extension,
  State,
  TokenizeContext,
} from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'

// Token types
const nunTemplateType = 'nunTemplate' as const
const nunTemplateValueType = 'nunTemplateValue' as const

// 🌊 is U+1F30A, encoded in UTF-16 as surrogate pair: 0xD83C 0xDF0A
const highSurrogate = 0xd83c
const lowSurrogate = 0xdf0a

/** Check if code is a markdown line ending (-3, -4, -5 in micromark) or null (eof). */
function eol(code: Code): boolean {
  return code === null || code === -5 || code === -4 || code === -3
}

const templateConstruct: Construct = {
  tokenize: function nunTemplateTokenize(
    this: TokenizeContext,
    effects: Effects,
    ok: State,
    nok: State,
  ): State {
    return start

    /** Match the high surrogate 0xD83C */
    function start(code: Code): State | undefined {
      if (code !== highSurrogate) return nok(code)
      effects.enter(nunTemplateType)
      effects.consume(code)
      return afterHighSurrogate
    }

    /** Match the low surrogate 0xDF0A */
    function afterHighSurrogate(code: Code): State | undefined {
      if (code !== lowSurrogate) return nok(code)
      effects.consume(code)
      effects.enter(nunTemplateValueType)
      return inValue
    }

    /** Consume characters until end of line */
    function inValue(code: Code): State | undefined {
      if (eol(code)) {
        effects.exit(nunTemplateValueType)
        effects.exit(nunTemplateType)
        return ok(code)
      }
      effects.consume(code)
      return inValue
    }
  },
}

/**
 * Create a micromark extension for the 🌊 template syntax.
 *
 * Recognizes `🌊template.class` at the flow level (start of line).
 * The 🌊 emoji is a surrogate pair in UTF-16, so we register the construct
 * under the high surrogate character code (0xD83C).
 */
export function nunTemplateSyntax(): Extension {
  return {
    flow: {
      [highSurrogate]: templateConstruct,
    },
  }
}

/**
 * Parse the raw template value string into template name and classes.
 *
 * - `"me.dark.wide"` → `{ template: "me", classes: ["dark", "wide"] }`
 * - `".dark.wide"` → `{ template: undefined, classes: ["dark", "wide"] }`
 * - `"me"` → `{ template: "me", classes: [] }`
 * - `""` → `{ template: undefined, classes: [] }`
 */
function parseTemplateValue(raw: string): {
  template: string | undefined
  classes: string[]
} {
  const trimmed = raw.trim()
  if (trimmed === '') return { template: undefined, classes: [] }

  const parts = trimmed.split('.')
  const template = parts[0] === '' ? undefined : parts[0]
  const classes = parts.slice(1).filter((c) => c !== '')
  return { template, classes }
}

/**
 * Create an mdast-util-from-markdown extension for the 🌊 template syntax.
 *
 * Converts `nunTemplate` tokens into `nunTemplate` mdast nodes with shape:
 * ```
 * { type: 'nunTemplate', template: string | undefined, classes: string[], position }
 * ```
 */
export function nunTemplateFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      [nunTemplateType](token) {
        this.enter(
          {
            type: 'nunTemplate' as any,
            template: undefined,
            classes: [],
            children: [],
          } as any,
          token,
        )
      },
    },
    exit: {
      [nunTemplateValueType](token) {
        const value = this.sliceSerialize(token)
        const node = this.stack[this.stack.length - 1] as any
        const parsed = parseTemplateValue(value)
        node.template = parsed.template
        node.classes = parsed.classes
      },
      [nunTemplateType](token) {
        this.exit(token)
      },
    },
  }
}
