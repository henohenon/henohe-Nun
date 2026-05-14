import type {
  Extension,
  Tokenizer,
  State,
  Effects,
  Code,
} from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'

// Token types
declare module 'micromark-util-types' {
  interface TokenTypeMap {
    nunNwytProp: 'nunNwytProp'
    nunNwytPropMarker: 'nunNwytPropMarker'
    nunNwytPropKey: 'nunNwytPropKey'
    nunNwytPropClassMarker: 'nunNwytPropClassMarker'
    nunNwytPropClass: 'nunNwytPropClass'
    nunNwytPropSeparator: 'nunNwytPropSeparator'
    nunNwytPropValue: 'nunNwytPropValue'
  }
}

function isAlphanumeric(code: Code): boolean {
  return (
    code !== null &&
    ((code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122)) // a-z
  )
}

const tokenize: Tokenizer = function (effects, ok, nok) {
  const start: State = function (code) {
    // Must be `!` (code 33)
    if (code !== 33) return nok(code)
    effects.enter('nunNwytProp')
    effects.enter('nunNwytPropMarker')
    effects.consume(code)
    effects.exit('nunNwytPropMarker')
    return keyStart
  }

  const keyStart: State = function (code) {
    // Key must start with alphanumeric
    if (!isAlphanumeric(code)) return nok(code)
    effects.enter('nunNwytPropKey')
    effects.consume(code)
    return keyRest
  }

  const keyRest: State = function (code) {
    // key 名は `[a-zA-Z0-9_-]` 許可 (class と同じ char set)。 var inline syntax
    // (`!color-brand~#fff` `!size-radius~12px` 等) を支えるために `-` `_` 解禁。
    // 既存 key (bg / fbg / fl / fr / icon / sub / lead / fn / card) は alphanumeric
    // のみなので互換性維持。
    if (isAlphanumeric(code) || code === 45 /* - */ || code === 95 /* _ */) {
      effects.consume(code)
      return keyRest
    }
    effects.exit('nunNwytPropKey')
    return afterKey(code)
  }

  const afterKey: State = function (code) {
    // `.` starts a class
    if (code === 46) {
      effects.enter('nunNwytPropClassMarker')
      effects.consume(code)
      effects.exit('nunNwytPropClassMarker')
      return classStart
    }
    // `~` is the separator — proceed to value
    if (code === 126) {
      effects.enter('nunNwytPropSeparator')
      effects.consume(code)
      effects.exit('nunNwytPropSeparator')
      return valueStart
    }
    // `[` means this is nwyt content, not prop — bail out
    // Anything else is also invalid
    return nok(code)
  }

  const classStart: State = function (code) {
    // Class must start with alphanumeric
    if (!isAlphanumeric(code)) return nok(code)
    effects.enter('nunNwytPropClass')
    effects.consume(code)
    return classRest
  }

  const classRest: State = function (code) {
    // class 名は `[a-zA-Z0-9_%-]` 許可。 `-` `_` は UnoCSS の `object-bottom`
    // `rounded-lg` 等で必須、 `%` は image-utility 微調整 token `tx-10%` / `ty--50%`
    // (translate-class.ts) の単位文字として許可。 nwyt-content.ts と挙動を揃える。
    if (
      isAlphanumeric(code) ||
      code === 45 /* - */ ||
      code === 95 /* _ */ ||
      code === 37 /* % */
    ) {
      effects.consume(code)
      return classRest
    }
    effects.exit('nunNwytPropClass')
    return afterKey(code)
  }

  const valueStart: State = function (code) {
    // Value can be empty (EOL right after ~)
    if (code === null || code === -3 || code === -4 || code === -5) {
      effects.enter('nunNwytPropValue')
      effects.exit('nunNwytPropValue')
      effects.exit('nunNwytProp')
      return ok(code)
    }
    effects.enter('nunNwytPropValue')
    effects.consume(code)
    return valueRest
  }

  const valueRest: State = function (code) {
    // EOL or EOF ends the value
    if (code === null || code === -3 || code === -4 || code === -5) {
      effects.exit('nunNwytPropValue')
      effects.exit('nunNwytProp')
      return ok(code)
    }
    effects.consume(code)
    return valueRest
  }

  return start
}

/** micromark syntax extension for `!key.class~value` (flow level) */
export function nunNwytPropSyntax(): Extension {
  return {
    flow: {
      [33]: { name: 'nunNwytProp', tokenize },
    },
  }
}

/** mdast-util fromMarkdown extension for nunNwytProp */
export function nunNwytPropFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      nunNwytProp(token) {
        this.enter(
          {
            type: 'nunNwytProp' as any,
            key: '',
            classes: [] as string[],
            rawValue: '',
            children: [],
          } as any,
          token,
        )
      },
    },
    exit: {
      nunNwytPropKey(token) {
        const node = this.stack[this.stack.length - 1] as any
        node.key = this.sliceSerialize(token)
      },
      nunNwytPropClass(token) {
        const node = this.stack[this.stack.length - 1] as any
        node.classes.push(this.sliceSerialize(token))
      },
      nunNwytPropValue(token) {
        const node = this.stack[this.stack.length - 1] as any
        node.rawValue = this.sliceSerialize(token)
      },
      nunNwytProp(token) {
        this.exit(token)
      },
    },
  }
}
