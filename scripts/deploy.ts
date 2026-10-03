import { existsSync, rmSync } from 'node:fs'
import { parseArgs, runCommand, loadEnvFile } from './_lib.ts'

const ENV_FILE = '.env.deploy'

if (!existsSync(ENV_FILE)) {
  console.error(`${ENV_FILE} が見つかりません。.env.deploy.example を参考に作成してください。`)
  process.exit(1)
}

loadEnvFile(ENV_FILE)

const { values } = parseArgs()
const deck = values['deck']

const projectName = process.env['CF_PROJECT_NAME']
// --deck 指定時はタイムスタンプブランチ → ブランチURLが推測不可能になる
const branch = deck ? `d-${Date.now()}` : 'production'

if (!projectName) {
  console.error('CF_PROJECT_NAME が .env.deploy に設定されていません。')
  process.exit(1)
}

const target = deck ? `デッキ "${deck}"` : '全デッキ'
console.log(`→ ビルド中 (${target})...`)
// 前回の出力 (別デッキの html 等) が混ざらないよう毎回作り直す
rmSync('dist', { recursive: true, force: true })
if (deck) {
  await runCommand('bunx', ['marp', `benben/${deck}.md`, '-o', `dist/${deck}.html`])
  await runCommand('bunx', ['tsx', 'scripts/copy-static.ts'])
} else {
  await runCommand('bun', ['run', 'build'])
}

console.log(`→ Cloudflare Pages にデプロイ中 (project: ${projectName}, branch: ${branch})...`)
await runCommand('bunx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name', projectName, '--branch', branch])
