import type {
  Extension,
  Tokenizer,
  State,
  Effects,
  Code,
} from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'

/** Token names used by the nwyt content extension */
const T = {
  nwytContent: 'nwytContent',
  nwytContentMarker: 'nwytContentMarker', // !
  nwytContentKey: 'nwytContentKey', // key
  nwytContentClass: 'nwytContentClass', // .class (including the dot)
  nwytContentValueMarker: 'nwytContentValueMarker', // [ and ]
  nwytContentValue: 'nwytContentValue', // content inside [...]
  nwytContentUrlMarker: 'nwytContentUrlMarker', // ( and )
  nwytContentUrl: 'nwytContentUrl', // content inside (...)
} as const

/** Check if a code is alphanumeric [a-zA-Z0-9] */
function isAlphanumeric(code: Code): boolean {
  if (code === null) return false
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  )
}

/** Check if code is end of line or end of file */
function isEolOrEof(code: Code): boolean {
  return code === null || code === -3 || code === -4 || code === -5
}

/**
 * micromark syntax extension for `!key.class[value](url)`.
 * Text-level construct registered on character code 33 (`!`).
 */
export function nunNwytContentSyntax(): Extension {
  const tokenize: Tokenizer = function (effects, ok, nok) {
    let bracketDepth = 0

    const start: State = function (code) {
      // Must start with `!` (code 33)
      if (code !== 33) return nok(code)
      effects.enter(T.nwytContent)
      effects.enter(T.nwytContentMarker)
      effects.consume(code)
      effects.exit(T.nwytContentMarker)
      return keyStart
    }

    const keyStart: State = function (code) {
      // `!.class[alt](url)` — key 省略の image 専用形 (handler 側で `<img>` に変換)
      if (code === 46) return classStart(code)
      // Key must start with alphanumeric
      if (!isAlphanumeric(code)) return nok(code)
      effects.enter(T.nwytContentKey)
      effects.consume(code)
      return keyRest
    }

    const keyRest: State = function (code) {
      if (isAlphanumeric(code)) {
        effects.consume(code)
        return keyRest
      }
      effects.exit(T.nwytContentKey)
      // After key: optional `.class` sequences, then must see `[`
      if (code === 46) return classStart(code) // `.`
      if (code === 91) return valueOpen(code) // `[`
      return nok(code)
    }

    function classStart(code: Code): State | undefined {
      // code is `.` (46)
      effects.enter(T.nwytContentClass)
      effects.consume(code)
      return classBody
    }

    const classBody: State = function (code) {
      // class 名は `[a-zA-Z0-9_%-]` 許可。 `-` `_` は UnoCSS の `object-bottom`
      // `rounded-lg` 等で必須、 `%` は image-utility 微調整 token `tx-10%` / `ty--50%`
      // (translate-class.ts) の単位文字として許可。 nwyt-prop.ts と挙動を揃える。
      if (
        isAlphanumeric(code) ||
        code === 45 /* - */ ||
        code === 95 /* _ */ ||
        code === 37 /* % */
      ) {
        effects.consume(code)
        return classBody
      }
      // Class must have at least one character after the dot
      effects.exit(T.nwytContentClass)
      if (code === 46) return classStart(code) // another `.class`
      if (code === 91) return valueOpen(code) // `[`
      return nok(code)
    }

    function valueOpen(code: Code): State | undefined {
      // code is `[` (91)
      effects.enter(T.nwytContentValueMarker)
      effects.consume(code)
      effects.exit(T.nwytContentValueMarker)
      bracketDepth = 1
      effects.enter(T.nwytContentValue)
      return valueContent
    }

    const valueContent: State = function (code) {
      if (isEolOrEof(code)) {
        // Unterminated bracket — fail
        return nok(code)
      }
      if (code === 91) {
        // `[` — nested bracket
        bracketDepth++
        effects.consume(code)
        return valueContent
      }
      if (code === 93) {
        // `]`
        bracketDepth--
        if (bracketDepth === 0) {
          effects.exit(T.nwytContentValue)
          effects.enter(T.nwytContentValueMarker)
          effects.consume(code)
          effects.exit(T.nwytContentValueMarker)
          return afterValue
        }
        effects.consume(code)
        return valueContent
      }
      effects.consume(code)
      return valueContent
    }

    const afterValue: State = function (code) {
      // Optional `(url)`
      if (code === 40) {
        // `(`
        effects.enter(T.nwytContentUrlMarker)
        effects.consume(code)
        effects.exit(T.nwytContentUrlMarker)
        effects.enter(T.nwytContentUrl)
        return urlContent
      }
      // No url part — done
      effects.exit(T.nwytContent)
      return ok(code)
    }

    const urlContent: State = function (code) {
      if (isEolOrEof(code)) {
        return nok(code)
      }
      if (code === 41) {
        // `)`
        effects.exit(T.nwytContentUrl)
        effects.enter(T.nwytContentUrlMarker)
        effects.consume(code)
        effects.exit(T.nwytContentUrlMarker)
        effects.exit(T.nwytContent)
        return ok
      }
      effects.consume(code)
      return urlContent
    }

    return start
  }

  return {
    text: {
      33: { name: T.nwytContent, tokenize },
    },
  }
}

/**
 * mdast-util fromMarkdown extension for nwyt content.
 * Produces `nwytContent` mdast nodes with `data: { key, classes, url }` and text children.
 */
export function nunNwytContentFromMarkdown(): FromMarkdownExtension {
  let key = ''
  let classes: string[] = []
  let url: string | undefined
  let value = ''

  return {
    enter: {
      [T.nwytContent](token) {
        key = ''
        classes = []
        url = undefined
        value = ''
        this.enter(
          {
            type: 'nwytContent' as any,
            data: { key: '', classes: [], url: undefined },
            children: [],
          } as any,
          token,
        )
      },
    },
    exit: {
      [T.nwytContentKey](token) {
        key = this.sliceSerialize(token)
      },
      [T.nwytContentClass](token) {
        // Token includes the leading dot, strip it
        const raw = this.sliceSerialize(token)
        classes.push(raw.startsWith('.') ? raw.slice(1) : raw)
      },
      [T.nwytContentValue](token) {
        value = this.sliceSerialize(token)
      },
      [T.nwytContentUrl](token) {
        url = this.sliceSerialize(token)
      },
      [T.nwytContent](token) {
        const node = this.stack[this.stack.length - 1] as any
        node.data = { key, classes, url }
        // Set value as a text child
        if (value) {
          node.children = [{ type: 'text', value }]
        }
        this.exit(token)
      },
    },
  }
}
