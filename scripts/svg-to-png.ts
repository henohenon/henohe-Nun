import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const [, , inPath, outPath] = process.argv
if (!inPath || !outPath) {
  console.error('usage: tsx svg-to-png.ts <in.svg> <out.png>')
  process.exit(1)
}

const buf = await sharp(readFileSync(inPath), { density: 144 }).png().toBuffer()
writeFileSync(outPath, buf)
console.log(`wrote ${outPath} (${(buf.byteLength / 1024).toFixed(1)} KB)`)
