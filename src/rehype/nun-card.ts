import type { Plugin } from 'unified'
import type { Root, Element, ElementContent } from 'hast'
import { visit, SKIP } from 'unist-util-visit'
import { h } from 'hastscript'
import { toString } from 'hast-util-to-string'

interface OgpData {
  title: string
  description: string
  image: string
  favicon: string
}

// プロセス内キャッシュ（dev サーバーではプロセス再起動まで保持）
const ogpCache = new Map<string, OgpData>()

export const rehypeNunCard: Plugin<[], Root> = function () {
  return async (tree: Root) => {
    const nodes: Array<{ node: Element; index: number; parent: any }> = []

    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName === 'span' &&
        (node.properties?.dataNwyt as string) === 'card' &&
        parent != null &&
        index != null
      ) {
        nodes.push({ node, index, parent })
        return SKIP
      }
    })

    if (nodes.length === 0) return

    // 並列 fetch
    const results = await Promise.all(
      nodes.map(({ node }) => {
        const url = node.properties?.dataNwytUrl as string | undefined
        const fallback = toString(node)
        return url ? fetchOgp(url, fallback) : Promise.resolve<OgpData>({ title: fallback, description: '', image: '', favicon: '' })
      })
    )

    // 後ろから splice（index がずれないよう逆順）
    for (let i = nodes.length - 1; i >= 0; i--) {
      const { node, index, parent } = nodes[i]
      const ogp = results[i]
      const url = node.properties?.dataNwytUrl as string | undefined
      const isVertical = Array.isArray(node.properties?.className)
        ? (node.properties.className as string[]).includes('v')
        : false

      const card = buildCard(ogp, url ?? '#', isVertical)
      parent.children.splice(index, 1, card)
    }

    // card は内部に <div> を含むため、親が <p> のままだと
    // ブラウザの adoption agency が走り a タグが分裂する。
    // card だけを含む <p> は card で unwrap する。
    visit(tree, 'element', (pNode: Element, pIndex, pParent: any) => {
      if (pNode.tagName !== 'p' || !pParent || pIndex == null) return
      const meaningful = (pNode.children as ElementContent[]).filter(c =>
        !(c.type === 'text' && /^\s*$/.test(c.value))
      )
      if (meaningful.length !== 1) return
      const only = meaningful[0]
      if (only.type !== 'element' || only.tagName !== 'a') return
      const cls = only.properties?.className
      if (!Array.isArray(cls) || !cls.includes('card')) return
      pParent.children.splice(pIndex, 1, only)
      return [SKIP, pIndex] as const
    })
  }
}

function buildCard(ogp: OgpData, url: string, vertical: boolean): Element {
  let domain = ''
  try { domain = new URL(url).hostname } catch { domain = url }

  const body: ElementContent[] = [
    h('div.card-title', ogp.title),
  ]
  if (ogp.description) {
    body.push(h('div.card-desc', ogp.description))
  }
  body.push(
    h('div.card-url', [
      ...(ogp.favicon ? [h('img.card-favicon', { src: ogp.favicon, alt: '' })] : []),
      h('span', domain),
    ])
  )

  const inner: ElementContent[] = []
  if (ogp.image) {
    // card 画像はスライドのフォーカスコンテンツ。lazy だとキャプチャ時に
    // 描画が間に合わないため eager 読み込み。
    inner.push(h('img.card-thumb', { src: ogp.image, alt: '' }))
  }
  inner.push(h('div.card-body', body))

  return h('a', {
    href: url,
    className: ['card', ...(vertical ? ['v'] : [])],
    target: '_blank',
    rel: 'noopener noreferrer',
  }, inner) as Element
}

async function fetchOgp(url: string, fallbackTitle: string): Promise<OgpData> {
  if (ogpCache.has(url)) return ogpCache.get(url)!

  let data: OgpData = { title: fallbackTitle, description: '', image: '', favicon: '' }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nun/1.0; +https://github.com/henohenon/henohe-Nun)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const origin = new URL(url).origin

    data = {
      title: getMetaContent(html, 'og:title') || getTagContent(html, 'title') || fallbackTitle,
      description: getMetaContent(html, 'og:description') || getMetaContent(html, 'description'),
      image: resolveUrl(getMetaContent(html, 'og:image'), origin),
      favicon: getFavicon(html, origin),
    }
  } catch (err) {
    process.stderr.write(`[nun-card] fetch failed: ${url}: ${err}\n`)
  }

  ogpCache.set(url, data)
  return data
}

function getMetaContent(html: string, prop: string): string {
  const e = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // ダブル・シングルクォート両対応、属性順不同
  for (const q of ['"', "'"] as const) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=${q}${e}${q}[^>]+content=${q}([^${q}]*)${q}` +
      `|<meta[^>]+content=${q}([^${q}]*)${q}[^>]+(?:property|name)=${q}${e}${q}`,
      'i'
    )
    const m = html.match(re)
    if (m) return decodeEntities(m[1] ?? m[2] ?? '')
  }
  return ''
}

function getTagContent(html: string, tag: string): string {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
  return m ? decodeEntities(m[1]) : ''
}

function getFavicon(html: string, origin: string): string {
  // <link rel="icon" href="..."> を探す
  const m = html.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]+)"/i)
    || html.match(/<link[^>]+href="([^"]+)"[^>]+rel="(?:shortcut )?icon"/i)
  if (m) return resolveUrl(m[1], origin)
  return origin + '/favicon.ico'
}

function resolveUrl(href: string, origin: string): string {
  if (!href) return ''
  try { return new URL(href, origin).href } catch { return '' }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
}
