// 「今回は」ページ用: 使うライブラリのロゴを 2 段で整列する SVG を生成
import fs from 'node:fs'
const DIR = 'public/images/engines'
const pathOf = slug => fs.readFileSync(`${DIR}/${slug}.svg`, 'utf8').match(/ d="([^"]+)"/)[1]

// row1 = 主役 (描画)、row2 = 必要な分だけ足す部品
const items = [
  { t: 'img', file: 'threejs-wm.png', label: 'Three.js', url: 'https://threejs.org', cx: 300, y: 80, w: 230, h: 61, ly: 215, fs: 24 },
  { t: 'img', file: 'pixijs.svg', label: 'PixiJS', url: 'https://pixijs.com', cx: 700, y: 70, w: 240, h: 94, ly: 215, fs: 26 },

  { t: 'img', file: 'babylonjs-wm.svg', label: 'Babylon.js', url: 'https://www.babylonjs.com', cx: 230, y: 268, w: 165, h: 56, ly: 378, fs: 18 },
  { t: 'img', file: 'tonejs.png', label: 'Tone.js', url: 'https://tonejs.github.io', cx: 500, y: 272, w: 68, h: 68, ly: 378, fs: 18, round: 10 },
  { t: 'si', slug: 'matterdotjs', label: 'Matter.js', url: 'https://brm.io/matter-js/', color: '#4B5562', cx: 760, y: 234, w: 150, h: 150, ly: 378, fs: 18 },
]

const render = it => {
  const x = it.cx - it.w / 2
  const mark = it.t === 'si'
    ? `<svg x="${x}" y="${it.y}" width="${it.w}" height="${it.h}" viewBox="0 0 24 24"><path d="${pathOf(it.slug)}" fill="${it.color}"/></svg>`
    : `<image href="/images/engines/${it.file}" x="${x}" y="${it.y}" width="${it.w}" height="${it.h}" preserveAspectRatio="xMidYMid meet"${it.round ? ` clip-path="inset(0 round ${it.round}px)"` : ''}/>`
  // `a` 配下なので base の underline を打ち消す
  const label = `<text x="${it.cx}" y="${it.ly}" text-anchor="middle" font-size="${it.fs}" fill="var(--sub)" style="text-decoration:none">${it.label}</text>`
  return `  <a href="${it.url}" target="_blank" rel="noopener noreferrer" aria-label="${it.label}" style="text-decoration:none"><title>${it.label}</title>${mark}${label}</a>`
}

const svg = `<svg viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
${items.map(render).join('\n')}
</svg>`

fs.writeFileSync(process.argv[2], svg)
console.log(`wrote ${process.argv[2]} (${items.length} logos)`)
