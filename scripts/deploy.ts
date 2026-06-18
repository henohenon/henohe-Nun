import { existsSync } from 'node:fs'
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
const branch = deck
  ? `d-${Date.now()}`
  : (process.env['CF_BRANCH'] ?? 'preview')

if (!projectName) {
  console.error('CF_PROJECT_NAME が .env.deploy に設定されていません。')
  process.exit(1)
}

// CF Pages 向けビルド設定を子プロセスに継承させる
process.env.NUN_BASE ??= '/'
if (deck) {
  process.env.DEPLOY_DECK = deck
} else {
  delete process.env.DEPLOY_DECK  // 親シェルで export されていても全デッキビルドに戻す
}

const target = deck ? `デッキ "${deck}"` : '全デッキ'
console.log(`→ ビルド中 (${target})...`)
await runCommand('bun', ['run', 'build'])

console.log(`→ Cloudflare Pages にデプロイ中 (project: ${projectName}, branch: ${branch})...`)
await runCommand('bunx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name', projectName, '--branch', branch])
