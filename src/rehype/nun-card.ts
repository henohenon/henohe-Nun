import type { Plugin } from 'unified'
import type { Root, Element, ElementContent } from 'hast'
import { visit, SKIP } from 'unist-util-visit'
import { h } from 'hastscript'
import { toString } from 'hast-util-to-string'
import ogs from 'open-graph-scraper'

/** card 縦長レイアウト指定の class 名 (`!card.v~...` の `.v`) */
const CARD_VERTICAL_CLASS = 'v'

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
        ? (node.properties.className as string[]).includes(CARD_VERTICAL_CLASS)
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
    className: ['card', ...(vertical ? [CARD_VERTICAL_CLASS] : [])],
    target: '_blank',
    rel: 'noopener noreferrer',
  }, inner) as Element
}

async function fetchOgp(url: string, fallbackTitle: string): Promise<OgpData> {
  if (ogpCache.has(url)) return ogpCache.get(url)!

  let data: OgpData = { title: fallbackTitle, description: '', image: '', favicon: '' }
  try {
    const { error, result } = await ogs({
      url,
      timeout: 8,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Nun/1.0; +https://github.com/henohenon/henohe-Nun)',
        },
      },
    })
    if (!error) {
      const origin = new URL(url).origin
      const baseUrl = result.requestUrl || origin
      data = {
        title: result.ogTitle || fallbackTitle,
        description: result.ogDescription || '',
        image: result.ogImage?.[0]?.url ? resolveUrl(result.ogImage[0].url, baseUrl) : '',
        favicon: result.favicon ? resolveUrl(result.favicon, baseUrl) : '',
      }
    }
  } catch (err) {
    process.stderr.write(`[nun-card] ogs failed: ${url}: ${err}\n`)
  }

  ogpCache.set(url, data)
  return data
}

function resolveUrl(href: string, origin: string): string {
  if (!href) return ''
  try { return new URL(href, origin).href } catch { return '' }
}
