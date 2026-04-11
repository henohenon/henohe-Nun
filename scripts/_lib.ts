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

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { readdir as readdirAsync, readFile, rm as rmAsync, stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { type Browser, type BrowserContext, chromium, type Page } from 'playwright';

const PORT = 4322;
export const WIDTH = 1920;
export const HEIGHT = 1080;
const DIST_DIR = 'dist';
// Must match astro.config.mjs `base`. Used by serveDist and openDeckPage.
const BASE = '/henohe-Nun/';

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
      // Strip the Astro base prefix so we can look up files in dist/.
      // e.g. /henohe-Nun/_astro/foo.css → /_astro/foo.css
      const stripped = pathname.startsWith(BASE) ? `/${pathname.slice(BASE.length)}` : pathname;
      const paths = [stripped, pathname];
      for (const p of paths) {
        const candidates = [join(DIST_DIR, p), join(DIST_DIR, p, 'index.html'), join(DIST_DIR, `${p}.html`)];
        for (const c of candidates) {
          try {
            const s = await stat(c);
            if (s.isFile()) {
              const data = await readFile(c);
              res.writeHead(200, {
                'Content-Type': MIME[extname(c).toLowerCase()] ?? 'application/octet-stream',
                'Content-Length': data.length,
              });
              res.end(data);
              return;
            }
          } catch {}
        }
      }
      res.writeHead(404);
      res.end('404');
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  server.listen(port, '127.0.0.1');
  return {
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

// --- deck enumeration ------------------------------------------------------

// Recursively walks benben/ and returns each deck's path relative to it
// (without the .md extension), e.g. `tour`, `private/portfolio`. That's
// both the CLI identifier and the URL slug under BASE.
async function listDecks(): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdirAsync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        await walk(join(dir, e.name), prefix ? `${prefix}/${e.name}` : e.name);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        const leaf = e.name.replace(/\.md$/, '');
        out.push(prefix ? `${prefix}/${leaf}` : leaf);
      }
    }
  }
  await walk('benben', '');
  return out.sort();
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
    try {
      proc.kill();
    } catch {}
    throw new Error('chromium did not write DevToolsActivePort');
  }

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);

  return {
    browser,
    close: async () => {
      try {
        await browser.close();
      } catch {}
      try {
        proc.kill();
      } catch {}
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
  // Disable View Transitions before the page scripts run. The hash-based
  // slide navigation uses `document.startViewTransition` for a cross-fade;
  // during PNG capture the fade leaves the previous slide faintly visible
  // on top of the current one.
  await page.addInitScript(() => {
    // biome-ignore lint/suspicious/noExplicitAny: runtime override
    (document as any).startViewTransition = undefined;
  });
  // Use 127.0.0.1 explicitly (not `localhost`). On Windows, `localhost`
  // resolves to ::1 first, but our static server binds only to 127.0.0.1.
  // If another process (e.g. a leftover `astro dev` server) holds ::1:PORT,
  // Playwright would silently hit that instead of our dist/ server.
  await page.goto(`http://127.0.0.1:${PORT}${BASE}${deck}#0`, { waitUntil: 'load' });
  // Hide the fullscreen hint (it has a 4s fade-out timer, which is longer
  // than our screenshot cadence). The @media print block in [deck].astro
  // already handles this for PDF output.
  await page.addStyleTag({ content: '.hint{display:none !important;} astro-dev-toolbar{display:none !important;}' });
  await page.evaluate(() => document.fonts?.ready);
  // Let the hash handler + clamp()/vmin layout settle.
  await page.waitForTimeout(200);
  return { ctx, page };
}

// --- orchestration ---------------------------------------------------------

export async function runExport(
  label: string,
  perDeck: (browser: Browser, deck: string) => Promise<void>,
  opts?: { deckFilter?: string },
): Promise<void> {
  const deckArg = opts?.deckFilter ?? process.argv.slice(2).find((a) => !a.startsWith('--'));

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
