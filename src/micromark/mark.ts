import type {
  Event,
  Extension,
  Resolver,
  State,
  Token,
  TokenizeContext,
  Tokenizer,
} from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import { splice } from 'micromark-util-chunked'
import { classifyCharacter } from 'micromark-util-classify-character'
import { resolveAll } from 'micromark-util-resolve-all'

const EQ = 61 // '='

const tokenizer = {
  name: 'nunMark',
  tokenize: tokenizeMark as Tokenizer,
  resolveAll: resolveAllMark as Resolver,
}

export function nunMarkSyntax(): Extension {
  return {
    text: { [EQ]: tokenizer },
    insideSpan: { null: [tokenizer] },
    attentionMarkers: { null: [EQ] },
  }
}

export function nunMarkFromMarkdown(): FromMarkdownExtension {
  return {
    canContainEols: ['nunMark'],
    enter: { nunMark: function (this: any, token: Token) { this.enter({ type: 'nunMark', children: [] }, token) } },
    exit:  { nunMark: function (this: any, token: Token) { this.exit(token) } },
  }
}

// ---------------------------------------------------------------------------

function resolveAllMark(events: Event[], context: TokenizeContext): Event[] {
  let index = -1

  while (++index < events.length) {
    if (
      events[index][0] === 'enter' &&
      events[index][1].type === 'nunMarkSequenceTemporary' &&
      (events[index][1] as any)._close
    ) {
      let open = index
      while (open--) {
        if (
          events[open][0] === 'exit' &&
          events[open][1].type === 'nunMarkSequenceTemporary' &&
          (events[open][1] as any)._open &&
          // Both sequences must be exactly 2 chars
          events[index][1].end.offset - events[index][1].start.offset === 2 &&
          events[open][1].end.offset - events[open][1].start.offset === 2
        ) {
          events[index][1].type = 'nunMarkSequence'
          events[open][1].type = 'nunMarkSequence'

          const mark: Token = {
            type: 'nunMark',
            start: { ...events[open][1].start },
            end: { ...events[index][1].end },
          }
          const text: Token = {
            type: 'nunMarkText',
            start: { ...events[open][1].end },
            end: { ...events[index][1].start },
          }

          const nextEvents: Event[] = [
            ['enter', mark, context],
            ['enter', events[open][1], context],
            ['exit', events[open][1], context],
            ['enter', text, context],
          ]

          const insideSpan = (context.parser.constructs as any).insideSpan?.null
          if (insideSpan) {
            splice(nextEvents, nextEvents.length, 0,
              resolveAll(insideSpan, events.slice(open + 1, index), context))
          }

          splice(nextEvents, nextEvents.length, 0, [
            ['exit', text, context],
            ['enter', events[index][1], context],
            ['exit', events[index][1], context],
            ['exit', mark, context],
          ])

          splice(events, open - 1, index - open + 3, nextEvents)
          index = open + nextEvents.length - 2
          break
        }
      }
    }
  }

  index = -1
  while (++index < events.length) {
    if (events[index][1].type === 'nunMarkSequenceTemporary') {
      events[index][1].type = 'data'
    }
  }

  return events
}

function tokenizeMark(this: TokenizeContext, effects: any, ok: State, nok: State): State {
  const previous = this.previous
  const events = this.events
  let size = 0

  const start: State = (code) => {
    if (previous === EQ && events[events.length - 1]?.[1].type !== 'characterEscape') {
      return nok(code)
    }
    effects.enter('nunMarkSequenceTemporary')
    return more(code)
  }

  const more: State = (code) => {
    const before = classifyCharacter(previous)
    if (code === EQ) {
      if (size > 1) return nok(code) // max 2 `=`
      effects.consume(code)
      size++
      return more
    }
    if (size < 2) return nok(code) // require exactly `==`
    const after = classifyCharacter(code)
    const open  = !after  || (before === 2 /* punctuation */ && after !== 2)
    const close = !before || (after  === 2 /* punctuation */ && before !== 2)
    const token = effects.exit('nunMarkSequenceTemporary') as any
    token._open  = open
    token._close = close
    return ok(code)
  }

  return start
}
