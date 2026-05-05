import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { preview as vitePreview } from 'vite'

export { findDecks } from '../src/decks.ts'

export function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
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
  // ビルド成果物は base = '/henohe-Nun/' で焼き込まれているので
  // preview もそのベースで明示的に上げる (vite.config の base は serve 時 '/' になる)
  const base = '/henohe-Nun/'
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
  // mermaid は client で動的 import → 非同期描画。
  // 全 .mermaid 要素が svg を持つまで待つ (mermaid なしのスライドは即 true)。
  await page.waitForFunction(() => {
    const els = document.querySelectorAll('.mermaid')
    return Array.from(els).every(el => el.querySelector('svg') !== null)
  }, { timeout: 15000 }).catch(() => {})
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
