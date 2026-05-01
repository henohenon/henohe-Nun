import type {
  Extension,
  Tokenizer,
  State,
  Code,
} from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import { fromMarkdown } from 'mdast-util-from-markdown'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CODE_COLON = 58 // `:`
const CODE_PLUS = 43 // `+`
const CODE_MINUS = 45 // `-`
const CODE_SPACE = 32 // ` `
const CODE_TAB = 9

const DEFAULT_TITLES: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  alert: 'Alert',
}

// ---------------------------------------------------------------------------
// Token types
// ---------------------------------------------------------------------------

const T = 'nunAdmonition'
const T_FENCE_OPEN = 'nunAdmonitionFenceOpen'
const T_FENCE_CLOSE = 'nunAdmonitionFenceClose'
const T_TYPE = 'nunAdmonitionType'
const T_COLLAPSE = 'nunAdmonitionCollapse'
const T_TITLE = 'nunAdmonitionTitle'
const T_BODY = 'nunAdmonitionBody'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAlphanumeric(code: Code): code is number {
  if (code === null) return false
  return (
    (code >= 0x30 && code <= 0x39) || // 0-9
    (code >= 0x41 && code <= 0x5a) || // A-Z
    (code >= 0x61 && code <= 0x7a) // a-z
  )
}

/** Check for micromark's line ending codes or EOF. */
function isLineEnding(code: Code): boolean {
  // micromark uses -3 (CRLF), -4 (LF), -5 (CR) for line endings
  return code === -3 || code === -4 || code === -5 || code === null
}

// ---------------------------------------------------------------------------
// Micromark syntax extension
// ---------------------------------------------------------------------------

/**
 * Micromark flow extension for `:::type[+/-] [title]` admonition blocks.
 *
 * Opening fence: 3+ colons, type name (alphanumeric), optional `+`/`-`,
 * optional space + custom title, then line ending.
 *
 * Closing fence: same number or more colons on a line by themselves.
 *
 * Everything between the fences is captured as a body token (raw text).
 * The fromMarkdown extension re-parses the body as markdown.
 */
export function nunAdmonitionSyntax(): Extension {
  const tokenize: Tokenizer = function (effects, ok, nok) {
    let openColonCount = 0
    let closingColonCount = 0
    let bodyStarted = false

    // ================================================================
    // Opening fence
    // ================================================================

    const start: State = function (code) {
      if (code !== CODE_COLON) return nok(code)
      effects.enter(T)
      effects.enter(T_FENCE_OPEN)
      openColonCount = 0
      return openColons(code)
    }

    const openColons: State = function (code) {
      if (code === CODE_COLON) {
        effects.consume(code)
        openColonCount++
        return openColons
      }
      if (openColonCount < 3) return nok(code)
      if (!isAlphanumeric(code)) return nok(code)
      effects.enter(T_TYPE)
      return typeName(code)
    }

    const typeName: State = function (code) {
      if (isAlphanumeric(code)) {
        effects.consume(code)
        return typeName
      }
      effects.exit(T_TYPE)
      if (code === CODE_PLUS || code === CODE_MINUS) {
        effects.enter(T_COLLAPSE)
        effects.consume(code)
        effects.exit(T_COLLAPSE)
        return afterMeta
      }
      return afterMeta(code)
    }

    const afterMeta: State = function (code) {
      if (code === CODE_SPACE || code === CODE_TAB) {
        effects.consume(code)
        return titleStart
      }
      if (isLineEnding(code)) {
        effects.exit(T_FENCE_OPEN)
        return fenceEnd(code)
      }
      return nok(code)
    }

    const titleStart: State = function (code) {
      if (isLineEnding(code)) {
        effects.exit(T_FENCE_OPEN)
        return fenceEnd(code)
      }
      if (code === CODE_SPACE || code === CODE_TAB) {
        effects.consume(code)
        return titleStart
      }
      effects.enter(T_TITLE)
      effects.consume(code)
      return titleContent
    }

    const titleContent: State = function (code) {
      if (isLineEnding(code)) {
        effects.exit(T_TITLE)
        effects.exit(T_FENCE_OPEN)
        return fenceEnd(code)
      }
      effects.consume(code)
      return titleContent
    }

    // ================================================================
    // After opening fence line ending — enter body scanning
    // ================================================================

    const fenceEnd: State = function (code) {
      if (code === null) {
        effects.exit(T)
        return ok(code)
      }
      // Consume the line ending
      effects.consume(code)
      return lineStart
    }

    // ================================================================
    // Body: line-by-line check for closing fence
    // ================================================================

    const lineStart: State = function (code) {
      if (code === null) {
        if (bodyStarted) effects.exit(T_BODY)
        effects.exit(T)
        return ok(code)
      }
      if (code === CODE_COLON) {
        closingColonCount = 0
        return closingColonCheck(code)
      }
      if (!bodyStarted) {
        effects.enter(T_BODY)
        bodyStarted = true
      }
      effects.consume(code)
      return bodyLine
    }

    /**
     * Count colons at line start. If it's a valid closing fence
     * (>= openColonCount colons followed by line ending / EOF),
     * close the body and the admonition. Otherwise, treat the
     * colons as body content.
     *
     * The closing fence colons are consumed into the body token
     * when bodyStarted is true. The fromMarkdown extension trims
     * the trailing fence line from the serialized body text.
     */
    const closingColonCheck: State = function (code) {
      if (code === CODE_COLON) {
        closingColonCount++
        if (!bodyStarted) {
          effects.enter(T_BODY)
          bodyStarted = true
        }
        effects.consume(code)
        return closingColonCheck
      }
      if (
        closingColonCount >= openColonCount &&
        (isLineEnding(code) || code === null)
      ) {
        // Valid closing fence
        if (bodyStarted) effects.exit(T_BODY)
        effects.enter(T_FENCE_CLOSE)
        effects.exit(T_FENCE_CLOSE)
        effects.exit(T)
        if (code !== null) effects.consume(code)
        return ok(code)
      }
      // Not a closing fence — continue as body content
      if (!bodyStarted) {
        effects.enter(T_BODY)
        bodyStarted = true
      }
      effects.consume(code)
      return bodyLine
    }

    const bodyLine: State = function (code) {
      if (code === null) {
        if (bodyStarted) effects.exit(T_BODY)
        effects.exit(T)
        return ok(code)
      }
      if (isLineEnding(code)) {
        effects.consume(code)
        return lineStart
      }
      effects.consume(code)
      return bodyLine
    }

    return start
  }

  return {
    flow: {
      [CODE_COLON]: {
        name: 'nunAdmonition',
        tokenize,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// mdast-util-from-markdown extension
// ---------------------------------------------------------------------------

/**
 * mdast-util-from-markdown extension for admonition blocks.
 *
 * Produces mdast nodes:
 * ```ts
 * {
 *   type: 'nunAdmonition',
 *   data: {
 *     admonitionType: 'note',
 *     collapse: null | 'open' | 'closed',
 *     title: 'Note',
 *   },
 *   children: [...],   // body parsed as markdown
 *   position,
 * }
 * ```
 *
 * The body text (captured raw by the tokenizer) is re-parsed using
 * `fromMarkdown()`. The closing fence line (colons that were consumed
 * into the body token) is trimmed before re-parsing.
 */
export function nunAdmonitionFromMarkdown(): FromMarkdownExtension {
  const closingFenceRe = /\n:{3,}$/

  return {
    enter: {
      [T](token) {
        this.enter(
          {
            type: 'nunAdmonition',
            data: {
              admonitionType: '',
              collapse: null,
              title: '',
            },
            children: [],
          } as any,
          token,
        )
      },
      [T_BODY]() {
        this.buffer()
      },
    },
    exit: {
      [T_TYPE](token) {
        const typeName = this.sliceSerialize(token)
        const node = this.stack[this.stack.length - 1] as any
        node.data.admonitionType = typeName
        node.data.title = DEFAULT_TITLES[typeName] ?? typeName
      },
      [T_COLLAPSE](token) {
        const marker = this.sliceSerialize(token)
        const node = this.stack[this.stack.length - 1] as any
        node.data.collapse = marker === '+' ? 'open' : 'closed'
      },
      [T_TITLE](token) {
        const title = this.sliceSerialize(token).trim()
        if (title) {
          const node = this.stack[this.stack.length - 1] as any
          node.data.title = title
        }
      },
      [T_BODY](token) {
        let raw = this.resume()
        // Trim the closing fence line that was consumed into the body.
        // The body may end with "\n:::" (or more colons).
        raw = raw.replace(closingFenceRe, '')
        // Handle edge case: body is only the closing fence (empty body)
        if (/^:{3,}$/.test(raw.trim())) {
          raw = ''
        }

        if (raw.trim()) {
          const tree = fromMarkdown(raw)
          const node = this.stack[this.stack.length - 1] as any
          node.children = tree.children
        }
      },
      [T_FENCE_OPEN]() {
        // no-op
      },
      [T_FENCE_CLOSE]() {
        // no-op
      },
      [T](token) {
        this.exit(token)
      },
    },
  }
}
