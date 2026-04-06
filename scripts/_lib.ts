// Shared plumbing for the build:pdf / build:png / build:thumb scripts.
//
// Runs under Node via tsx (see package.json). We avoid Bun here because
// Playwright's default launch transport hangs under Bun on Windows and its
// connectOverCDP WebSocket client hits Bun's `ws` polyfill, which returns
// 200 OK for the upgrade instead of 101. Node + Playwright is the boring
// combination that Just Works on every OS, local + CI.
//
// Each thin wrapper script calls runExport(perDeck) and gets:
//   - astro build
//   - a tiny Node static server for dist/
//   - chromium launched with --remote-debugging-port, attached via
//     connectOverCDP (launch() over pipe is avoided for parity with the
//     Bun fallback path and to keep one code path across OSes)
//   - deck enumeration + per-deck iteration + teardown

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { readFile, readdir as readdirAsync, rm as rmAsync, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { tmpdir } from 'node:os';

export const PORT = 4322;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DIST_DIR = 'dist';

// --scale=N flag (deviceScaleFactor for screenshots, also used by pdf).
// Defaults to 1. Use 2 for retina-quality PNGs (3840×2160).
export function parseScale(): number {
  const arg = process.argv.find((a) => a.startsWith('--scale='));
  if (!arg) return 1;
  const n = Number.parseFloat(arg.split('=')[1]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// --- subprocess ------------------------------------------------------------

export function sh(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on('error', reject);
  });
}

// --- static server ---------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function serveDist(port: number): { close: () => Promise<void> } {
  const server: Server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      const pathname = decodeURIComponent(url.pathname);
      // Also try stripping the first path segment (Astro base prefix).
      // e.g. /henohe-Nun/_astro/foo.css → /_astro/foo.css
      const stripped = pathname.replace(/^\/[^/]+\//, '/');
      const candidates = [
        join(DIST_DIR, pathname),
        join(DIST_DIR, pathname, 'index.html'),
        join(DIST_DIR, pathname + '.html'),
        join(DIST_DIR, stripped),
        join(DIST_DIR, stripped, 'index.html'),
      ];
      for (const p of candidates) {
        try {
          const s = await stat(p);
          if (s.isFile()) {
            const data = await readFile(p);
            res.writeHead(200, {
              'Content-Type': MIME[extname(p).toLowerCase()] ?? 'application/octet-stream',
              'Content-Length': data.length,
            });
            res.end(data);
            return;
          }
        } catch {}
      }
      res.writeHead(404);
      res.end('404');
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  server.listen(port);
  return {
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

// --- deck enumeration ------------------------------------------------------

export async function listDecks(): Promise<string[]> {
  const files = await readdirAsync('benben');
  return files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

// --- chromium launcher -----------------------------------------------------

// Spawns chromium ourselves with --remote-debugging-port and attaches
// Playwright via connectOverCDP. This bypasses Playwright's pipe-based
// launch transport entirely, sidestepping the Bun-on-Windows hang and
// keeping a single code path across local + CI.
//
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH overrides the auto-detected binary.
function findChromiumExecutable(): string {
  const override = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (override) return override;

  const base =
    process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
      : join(process.env.HOME ?? '', '.cache', 'ms-playwright');

  if (existsSync(base)) {
    const versions = readdirSync(base)
      .filter((n) => /^chromium-\d+$/.test(n))
      .sort()
      .reverse();
    for (const v of versions) {
      const candidates =
        process.platform === 'win32'
          ? [join(base, v, 'chrome-win64', 'chrome.exe')]
          : process.platform === 'darwin'
          ? [join(base, v, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')]
          : [join(base, v, 'chrome-linux', 'chrome')];
      for (const c of candidates) if (existsSync(c)) return c;
    }
  }

  return chromium.executablePath();
}

type LaunchedChromium = {
  browser: Browser;
  close: () => Promise<void>;
};

async function launchChromium(): Promise<LaunchedChromium> {
  const exe = findChromiumExecutable();
  const userDataDir = join(tmpdir(), `henohe-chromium-${process.pid}-${Date.now()}`);

  const proc = spawn(
    exe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      '--hide-scrollbars',
      '--mute-audio',
      // Let chromium pick a free port and write it to DevToolsActivePort
      // inside the user data dir. More reliable than guessing a random high
      // port that may be reserved or already in use on Windows.
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  // Read DevToolsActivePort: first line = port, second line = browser path.
  const portFile = join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + 30_000;
  let port = 0;
  while (Date.now() < deadline) {
    try {
      const raw = await readFile(portFile, 'utf8');
      const line = raw.split('\n')[0]?.trim();
      const n = line ? Number.parseInt(line, 10) : NaN;
      if (Number.isFinite(n) && n > 0) {
        port = n;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (port === 0) {
    try { proc.kill(); } catch {}
    throw new Error('chromium did not write DevToolsActivePort');
  }

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);

  return {
    browser,
    close: async () => {
      try { await browser.close(); } catch {}
      try { proc.kill(); } catch {}
      await rmAsync(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

// --- per-deck page helper --------------------------------------------------

export async function openDeckPage(
  browser: Browser,
  deck: string,
  viewport: { width: number; height: number },
  deviceScaleFactor = 1,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/${deck}#0`, { waitUntil: 'load' });
  // Hide the fullscreen hint (it has a 4s fade-out timer, which is longer
  // than our screenshot cadence). The @media print block in [deck].astro
  // already handles this for PDF output.
  await page.addStyleTag({ content: '.hint{display:none !important;} astro-dev-toolbar{display:none !important;}' });
  await page.evaluate(() => (document as any).fonts?.ready);
  // Let the hash handler + clamp()/vmin layout settle.
  await page.waitForTimeout(200);
  return { ctx, page };
}

// --- orchestration ---------------------------------------------------------

export async function runExport(
  label: string,
  perDeck: (browser: Browser, deck: string) => Promise<void>,
): Promise<void> {
  const deckArg = process.argv.slice(2).find((a) => !a.startsWith('--'));

  if (process.env.SKIP_BUILD) {
    console.log(`[${label}] skipping astro build (SKIP_BUILD)`);
  } else {
    console.log(`[${label}] building...`);
    await sh('bunx', ['astro', 'build']);
  }

  console.log(`[${label}] serving ${DIST_DIR}/ on :${PORT}`);
  const server = serveDist(PORT);
  try {
    const decks = deckArg ? [deckArg] : await listDecks();
    if (decks.length === 0) {
      console.log('no decks found');
      return;
    }
    const launched = await launchChromium();
    try {
      for (const d of decks) {
        console.log(`[${label}] ${d}`);
        await perDeck(launched.browser, d);
      }
    } finally {
      await launched.close();
    }
  } finally {
    await server.close();
  }
  console.log(`[${label}] done`);
}
