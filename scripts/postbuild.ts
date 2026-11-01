import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'

// marp -I は md → html の変換のみで画像をコピーしないため、ビルド後に静的ファイルを dist/ へ揃える
cpSync('benben/images', 'dist/images', { recursive: true })
cpSync('public', 'dist', { recursive: true })

// 旧構成の URL (/<deck>/) を新しい /<deck>.html へ転送する。#N のスライド位置は引き継ぐ
for (const file of readdirSync('benben')) {
  if (!file.endsWith('.md')) continue
  const deck = file.slice(0, -'.md'.length)
  const target = `../${deck}.html`
  mkdirSync(`dist/${deck}`, { recursive: true })
  writeFileSync(`dist/${deck}/index.html`, `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${deck}</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)} + location.hash)</script>
</head>
</html>
`)
}
