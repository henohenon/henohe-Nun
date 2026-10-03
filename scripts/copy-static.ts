import { cpSync } from 'node:fs'

// marp -I は md → html の変換のみで画像をコピーしないため、ビルド後に静的ファイルを dist/ へ揃える
cpSync('benben/images', 'dist/images', { recursive: true })
cpSync('public', 'dist', { recursive: true })
