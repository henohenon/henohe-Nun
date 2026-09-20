// エンジンロゴ「ごった煮」SVG の生成。出力を md の embed_svg に貼る。
// 名前入りロゴ (ワードマーク) を優先、無いものだけ simple-icons のアイコンを使う。
// 配置は seed 固定の乱数 + 衝突判定でパッキング (大きいものから置く)。
import fs from 'node:fs'
const DIR = 'public/images/engines'
const pathOf = slug => fs.readFileSync(`${DIR}/${slug}.svg`, 'utf8').match(/ d="([^"]+)"/)[1]

const W = 1000, H = 699, MARGIN = 7

// t: 'img' | 'si' | 'crop' | 'chip' / w: 基準幅 / r: アスペクト比 (w/h)
const items = [
  { t: 'img', file: 'unreal-wm.svg', name: 'Unreal Engine', url: 'https://www.unrealengine.com', w: 300, r: 7.66 },
  { t: 'img', file: 'unity-wm.svg', name: 'Unity', url: 'https://unity.com', w: 255, r: 2.75 },
  { t: 'img', file: 'phaser.png', name: 'Phaser', url: 'https://phaser.io', w: 200, r: 4.61 },
  { t: 'img', file: 'godot-wm.svg', name: 'Godot Engine', url: 'https://godotengine.org', w: 200, r: 4.64 },
  { t: 'img', file: 'threejs-wm.png', name: 'Three.js', url: 'https://threejs.org', w: 185, r: 3.75 },
  { t: 'img', file: 'tyranobuilder.png', name: 'ティラノビルダー', url: 'https://b.tyrano.jp', w: 180, r: 5.52 },
  { t: 'img', file: 'gamemaker-wm.svg', name: 'GameMaker', url: 'https://gamemaker.io', w: 175, r: 4.20 },
  { t: 'img', file: 'roblox-wm.svg', name: 'Roblox Studio', url: 'https://create.roblox.com', w: 172, r: 5.74 },
  { t: 'chip', file: 'playcanvas-wm.svg', name: 'PlayCanvas', url: 'https://playcanvas.com', w: 172, r: 3.6, bg: '#1A1A1A' },
  { t: 'img', file: 'siv3d.png', name: 'Siv3D', url: 'https://siv3d.github.io', w: 170, r: 3.20 },
  { t: 'img', file: 'pixijs.svg', name: 'PixiJS', url: 'https://pixijs.com', w: 165, r: 2.54 },
  { t: 'img', file: 'defold-wm.svg', name: 'Defold', url: 'https://defold.com', w: 165, r: 3.53 },
  { t: 'crop', file: 'rpgmaker-ogp.png', name: 'RPGツクール', url: 'https://rpgmakerofficial.com', w: 165, r: 4.63, vb: '378 268 444 96', iw: 1200, ih: 630 },
  { t: 'img', file: 'bevy-wm.svg', name: 'Bevy', url: 'https://bevy.org', w: 158, r: 3.94 },
  { t: 'img', file: 'babylonjs-wm.svg', name: 'Babylon.js', url: 'https://www.babylonjs.com', w: 168, r: 2.94 },
  { t: 'img', file: 'scratch-wm.svg', name: 'Scratch', url: 'https://scratch.mit.edu', w: 140, r: 2.97 },
  { t: 'chip', file: 'pico8.png', name: 'PICO-8', url: 'https://www.lexaloffle.com/pico-8.php', w: 135, r: 2.33, bg: '#1D2B53' },
  { t: 'img', file: 'p5js-wm.svg', name: 'p5.js', url: 'https://p5js.org', w: 110, r: 2.19 },
  { t: 'img', file: 'love2d-wm.png', name: 'LÖVE', url: 'https://love2d.org', w: 95, r: 1.29 },
  { t: 'si', slug: 'cocos', name: 'Cocos', url: 'https://www.cocos.com', color: '#55C2E1', w: 72, r: 1 },
  { t: 'si', slug: 'epicgames', name: 'Epic Games / UEFN', url: 'https://dev.epicgames.com/documentation/en-us/uefn', color: '#313131', w: 64, r: 1 },
  { t: 'img', file: 'renpy-wm.png', name: "Ren'Py", url: 'https://www.renpy.org', w: 62, r: 0.65 },
  { t: 'img', file: 'dxlib.jpg', name: 'DXライブラリ', url: 'https://dxlib.xsrv.jp', w: 58, r: 1 },
  { t: 'img', file: 'ebitengine.png', name: 'Ebitengine', url: 'https://ebitengine.org', w: 56, r: 1 },
  { t: 'si', slug: 'bitsy', name: 'Bitsy', url: 'https://ledoux.itch.io/bitsy', color: '#6767B2', w: 46, r: 1 },
  // --- 追加分: DCC ツール / ライブラリ / 和製ツール ---
  { t: 'img', file: 'live2d.png', name: 'Live2D', url: 'https://www.live2d.com/', w: 150, r: 4.00 },
  { t: 'img', file: 'rapier.svg', name: 'Rapier', url: 'https://rapier.rs/', w: 190, r: 4.02 },
  { t: 'text', label: 'WOLF RPGエディター', name: 'WOLF RPGエディター', url: 'https://silversecond.com/WolfRPGEditor/', color: '#2B2B2B', w: 200, r: 7.5 },
  { t: 'text', label: '吉里吉里Z', name: '吉里吉里Z', url: 'https://krkrz.github.io/', color: '#2B2B2B', w: 110, r: 3.9 },
  { t: 'si', slug: 'matterdotjs', name: 'Matter.js', url: 'https://brm.io/matter-js/', color: '#4B5562', w: 105, r: 1 },
  { t: 'si', slug: 'webgl', name: 'WebGL', url: 'https://www.khronos.org/webgl/', color: '#990000', w: 72, r: 1 },
  { t: 'si', slug: 'blender', name: 'Blender', url: 'https://www.blender.org/', color: '#E87D0D', w: 66, r: 1 },
  { t: 'si', slug: 'autodeskmaya', name: 'Maya', url: 'https://www.autodesk.com/products/maya/', color: '#37A5CC', w: 66, r: 1 },
  { t: 'si', slug: 'houdini', name: 'Houdini', url: 'https://www.sidefx.com/', color: '#FF4713', w: 62, r: 1 },
  { t: 'si', slug: 'raylib', name: 'raylib', url: 'https://www.raylib.com/', color: '#0F0F10', w: 62, r: 1 },
  { t: 'img', file: 'tonejs.png', name: 'Tone.js', url: 'https://tonejs.github.io/', w: 58, r: 1 },
]

// --- seed 固定の乱数 (mulberry32) ---
const rng = (seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
  return ((t ^ t >>> 14) >>> 0) / 4294967296
})(Number(process.argv[3] ?? 7))

const hits = (a, b) =>
  a.x < b.x + b.w + MARGIN && b.x < a.x + a.w + MARGIN &&
  a.y < b.y + b.h + MARGIN && b.y < a.y + a.h + MARGIN

const pack = scale => {
  const placed = []
  for (const it of items) {
    const w = it.w * scale, h = w / it.r
    let ok = false
    for (let n = 0; n < 4000 && !ok; n++) {
      const x = rng() * (W - w), y = rng() * (H - h)
      const box = { x, y, w, h }
      if (placed.every(p => !hits(box, p))) {
        placed.push({ ...it, ...box, rot: (rng() * 2 - 1) * 13 })
        ok = true
      }
    }
    if (!ok) return null
  }
  return placed
}

let placed = null, scale = 1.25
while (!placed && scale > 0.5) { placed = pack(scale); if (!placed) scale -= 0.03 }
if (!placed) { console.error('packing failed'); process.exit(1) }

const render = it => {
  const round = n => Math.round(n * 10) / 10
  const [x, y, w, h] = [round(it.x), round(it.y), round(it.w), round(it.h)]
  let body
  if (it.t === 'si') {
    body = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 24 24"><path d="${pathOf(it.slug)}" fill="${it.color}"/></svg>`
  } else if (it.t === 'crop') {
    body = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${it.vb}"><image href="/images/engines/${it.file}" x="0" y="0" width="${it.iw}" height="${it.ih}"/></svg>`
  } else if (it.t === 'chip') {
    body = `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${it.bg}"/><image href="/images/engines/${it.file}" x="${round(it.x + w * 0.06)}" y="${round(it.y + h * 0.16)}" width="${round(w * 0.88)}" height="${round(h * 0.68)}" preserveAspectRatio="xMidYMid meet"/></g>`
  } else if (it.t === 'text') {
    // 公式ロゴが無いツールは、デッキのフォントで組んだワードマークで代用
    body = `<text x="${round(it.x + w / 2)}" y="${round(it.y + h / 2)}" text-anchor="middle" dominant-baseline="central" font-size="${round(h)}" font-weight="700" fill="${it.color}">${it.label}</text>`
  } else {
    body = `<image href="/images/engines/${it.file}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`
  }
  const g = `<g transform="rotate(${round(it.rot)} ${round(it.x + w / 2)} ${round(it.y + h / 2)})">${body}</g>`
  return `  <a href="${it.url}" target="_blank" rel="noopener noreferrer" aria-label="${it.name}" style="text-decoration:none"><title>${it.name}</title>${g}</a>`
}

// 段階的に増やす reveal。配置は全体で 1 回だけ packing して、各段はその部分集合を描く。
const STAGES = [
  ['Unity'],
  ['Unreal Engine'],
  ['Scratch', 'Godot Engine', 'Bevy'],
  ['Bitsy', "Ren'Py", 'Ebitengine'],
  ['RPGツクール', 'ティラノビルダー', 'WOLF RPGエディター', '吉里吉里Z', 'DXライブラリ', 'Siv3D'],
  ['GameMaker', 'Defold', 'Cocos', 'PlayCanvas', 'Roblox Studio', 'Epic Games / UEFN', 'PICO-8', 'LÖVE', 'raylib'],
  ['Three.js', 'Babylon.js', 'PixiJS', 'Phaser', 'p5.js', 'WebGL'],
  ['Tone.js', 'Rapier', 'Matter.js', 'Live2D', 'Blender', 'Maya', 'Houdini'],
]

const known = new Set(placed.map(p => p.name))
for (const s of STAGES) for (const n of s) if (!known.has(n)) console.error(`[stage] unknown item: ${n}`)
const staged = new Set(STAGES.flat())
for (const n of known) if (!staged.has(n)) console.error(`[stage] item never revealed: ${n}`)

const wrap = list => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
${list.map(render).join('\n')}
</svg>`

const out = process.argv[2]
let shown = []
STAGES.forEach((stage, i) => {
  shown = [...shown, ...placed.filter(p => stage.includes(p.name))]
  const file = out.replace(/\.svg$/, `-${i + 1}.svg`)
  fs.writeFileSync(file, wrap(shown))
  console.log(`wrote ${file} (${shown.length}/${placed.length} logos)`)
})
fs.writeFileSync(out, wrap(placed))
console.log(`wrote ${out} (all ${placed.length} logos, scale ${scale.toFixed(2)})`)
