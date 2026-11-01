// Marp を Nun に寄せるための functional engine (spike)
import { readFile } from 'node:fs/promises'
import container from 'markdown-it-container'
import mark from 'markdown-it-mark'

const ADMONITIONS = ['note', 'info', 'tip', 'warning', 'alert']
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default async ({ marp }) => {
  // OGP は事前取得したキャッシュを同期的に読むだけ (取得は別スクリプト or ここで await)
  const ogp = JSON.parse(await readFile(new URL('./ogp-cache.json', import.meta.url), 'utf8').catch(() => '{}'))

  // --- !fl / !fr 相当: カスタム directive (fl → footer, fr → header を CSS で右下へ)
  marp.customDirectives.local.fl = (v) => ({ footer: v })
  marp.customDirectives.local.fr = (v) => ({ header: v })

  marp.use(mark)

  // --- :::note タイトル (Nun と同じ記法)
  for (const type of ADMONITIONS) {
    marp.use(container, type, {
      render(tokens, idx) {
        const t = tokens[idx]
        if (t.nesting !== 1) return '</div>\n'
        const title = t.info.trim().slice(type.length).trim() || type[0].toUpperCase() + type.slice(1)
        return `<div class="admonition ${type}"><p class="admonition-title">${esc(title)}</p>\n`
      },
    })
  }

  const md = marp.markdown

  // --- ```lang:name#n / diff_lang / embed_html / embed_svg
  const fence = md.renderer.rules.fence
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const t = tokens[idx]
    const m = t.info.trim().match(/^(embed_|diff_)?([\w-]+)(?::([^#\s]+))?(?:#(\d+))?$/)
    if (!m) return fence(tokens, idx, opts, env, self)
    const [, prefix, lang, name] = m
    if (prefix === 'embed_' && (lang === 'html' || lang === 'svg')) return t.content
    t.info = prefix === 'diff_' ? 'diff' : lang
    const caption = name ? `${lang}:${name}` : lang
    return `<figure class="code"><figcaption>${esc(caption)}</figcaption>${fence(tokens, idx, opts, env, self)}</figure>`
  }

  // --- !card[alt](url) / !fn[id] (inline)
  md.inline.ruler.before('link', 'nun_content', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x21 /* ! */) return false
    const rest = state.src.slice(state.pos)
    let m
    if ((m = rest.match(/^!card(\.v)?\[([^\]]*)\]\(([^)\s]+)\)/))) {
      if (!silent) {
        const [, v, alt, url] = m
        const o = ogp[url] ?? { title: alt, description: '' }
        const tok = state.push('html_inline', '', 0)
        tok.content = `<a class="card${v ? ' v' : ''}" href="${esc(url)}"><span><b>${esc(o.title)}</b><br><span class="card-desc">${esc(o.description || url)}</span></span></a>`
      }
      state.pos += m[0].length
      return true
    }
    if ((m = rest.match(/^!fn\[([^\]]+)\]/))) {
      if (!silent) state.push('nun_fn_ref', 'sup', 0).meta = { id: m[1] }
      state.pos += m[0].length
      return true
    }
    return false
  })

  // --- !fn~[id]: 定義のあるスライド番号と本文を収集 (スライド単位)
  md.core.ruler.push('nun_fn_def', (state) => {
    const defs = (state.env.nunFn = {})
    let slide = 0
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'marpit_slide_open') slide++
      if (tokens[i].type !== 'inline') continue
      const m = tokens[i].content.match(/^!fn~\[([^\]]+)\]\s*$/)
      if (!m) continue
      // 定義段落を消費 (paragraph_open / inline / paragraph_close を hidden 化)
      tokens[i - 1].hidden = tokens[i + 1].hidden = true
      tokens[i].children = []
      // 同スライド内の以降のテキストを tooltip 用に集める
      let text = ''
      for (let j = i + 2; j < tokens.length && tokens[j].type !== 'marpit_slide_close' && !['header', 'footer'].includes(tokens[j].tag); j++)
        if (tokens[j].type === 'inline') text += tokens[j].content + ' '
      defs[m[1]] = { slide, text: text.trim() }
    }
  })
  md.renderer.rules.nun_fn_ref = (tokens, idx, _o, env) => {
    const { id } = tokens[idx].meta
    const def = env.nunFn?.[id]
    return def
      ? `<sup class="fn"><a href="#${def.slide}" title="${esc(def.text)}">[${esc(id)}]</a></sup>`
      : `<sup class="fn">[${esc(id)}]</sup>`
  }

  // --- Nun 行記法の糖衣 (🌊 / !key~ / ~~~meta) — テキストを Marp 記法へ書き換えてから render
  const render = marp.render.bind(marp)
  marp.render = (src, env) => render(desugar(src), env)

  return marp
}

/** 行単位の書き換え。 コードフェンス内は触らない。 */
function desugar(src) {
  if (!src.startsWith('~~~meta')) return src // Marp 記法で書かれたファイルはそのまま
  const lines = src.split('\n')
  const out = []
  const front = ['theme: nun', 'headingDivider: 1']
  let globalClasses = []
  let seenH1 = false
  let fence = null
  let i = 0

  // ~~~meta → front-matter
  for (i = 1; i < lines.length && lines[i] !== '~~~'; i++) front.push(lines[i])
  i++

  for (; i < lines.length; i++) {
    const line = lines[i]
    const f = line.match(/^(`{3,}|~{3,})/)
    if (fence) { if (f && line.startsWith(fence)) fence = null; out.push(line); continue }
    if (f) { fence = f[1]; out.push(line); continue }

    if (/^# /.test(line) || line === '#') seenH1 = true

    const tpl = line.match(/^🌊([\w-]*)((?:\.[\w-]+)*)\s*$/)
    if (tpl) {
      const classes = tpl[2].split('.').filter(Boolean)
      if (!seenH1) { globalClasses.push(...classes); continue }
      out.push(`<!-- _class: ${[tpl[1] || 'default', ...classes, ...globalClasses].join(' ')} -->`)
      continue
    }

    const nwyt = line.match(/^!(fl|fr|sub|lead|bg)~(.*)$/)
    if (nwyt) {
      const [, key, value] = nwyt
      if (key === 'fl' || key === 'fr') {
        if (!seenH1) front.push(`${key}: ${JSON.stringify(value)}`)
        else out.push(`<!-- _${key}: ${JSON.stringify(value)} -->`)
      } else if (key === 'lead') out.push(`<p class="lead">${value}</p>`)
      else if (key === 'bg') out.push(value.replace(/^\[([^\]]*)\]/, '![bg]'))
      else out.push(value) // sub: title template が p を subtitle として扱う
      continue
    }
    out.push(line)
  }
  if (globalClasses.length) front.push(`class: ${globalClasses.join(' ')}`)
  return `---\n${front.join('\n')}\n---\n${out.join('\n')}`
}
