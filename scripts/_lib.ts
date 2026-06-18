import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { preview as vitePreview } from 'vite'

export { findDecks } from '../src/plugin/decks.ts'

export function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

export function loadEnvFile(path: string): void {
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    const q = raw[0]
    const end = (q === '"' || q === "'") ? raw.indexOf(q, 1) : -1
    const val = end !== -1
      ? raw.slice(1, end)
      : raw.replace(/\s+#.*$/, '').trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

export async function ensureBuild(): Promise<void> {
  if (existsSync('dist/index.html')) return
  await runCommand('bun', ['run', 'build'])
}

export function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true })
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)))
  })
}

export interface PreviewServer {
  baseUrl: string
  close: () => Promise<void>
}

export async function startPreview(port = 5176): Promise<PreviewServer> {
  const base = process.env.NUN_BASE ?? '/henohe-Nun/'
  const server = await vitePreview({
    base,
    preview: { port, strictPort: true },
    logLevel: 'error',
  })
  return {
    baseUrl: `http://localhost:${port}${base.replace(/\/$/, '')}`,
    close: () => new Promise<void>((resolve) => server.httpServer.close(() => resolve())),
  }
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch()
}

export async function openDeck(
  browser: Browser,
  baseUrl: string,
  deck: string,
  viewport: { width: number; height: number },
): Promise<Page> {
  const page = await browser.newPage({ viewport })
  // ビュー遷移が走るとスクショ時に新旧スナップショットが重なって写るので無効化
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined, writable: false })
  })
  await page.goto(`${baseUrl}/${deck}/`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => (document as any).fonts?.ready)
  // mermaid は client で動的 import → 非同期描画 → 完了で
  // `document.documentElement.dataset.mermaidReady` を立てる (`src/client/index.ts`)。
  // mermaid 要素がないデッキでも初期化時点で即 ready が立つので一律待つ形で OK。
  await page.waitForFunction(() => {
    return 'mermaidReady' in document.documentElement.dataset
  }, { timeout: 30000 }).catch(() => {})
  return page
}

export async function countSlides(page: Page): Promise<number> {
  return page.locator('section').count()
}

export async function gotoSlide(page: Page, n: number): Promise<void> {
  await page.evaluate((n) => {
    if (location.hash === '#' + n) {
      location.hash = '#__nun_pre__'
    }
    location.hash = '#' + n
  }, n)
  await page.waitForFunction(
    (n) => document.querySelector('section.active')?.id === String(n),
    n,
    { timeout: 5000 },
  ).catch(() => {})
  await page.waitForTimeout(150)
}

export interface ParsedArgs {
  values: Record<string, string>
  flags: Set<string>
}

export function parseArgs(argv = process.argv.slice(2)): ParsedArgs {
  const values: Record<string, string> = {}
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next == null || next.startsWith('--')) {
      flags.add(key)
    } else {
      values[key] = next
      i++
    }
  }
  return { values, flags }
}
