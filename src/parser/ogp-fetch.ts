import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface OgpData {
  title: string;
  description: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  favicon: string | null;
  siteName: string;
  url: string;
}

// --- 2-layer cache: memory + file ---

const CACHE_DIR = 'node_modules/.cache/nun-ogp';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

type CacheEntry = { data: OgpData | null; ts: number };

const memoryCache = new Map<string, CacheEntry>();

function filePath(url: string): string {
  const safe = Buffer.from(url).toString('base64url');
  return join(CACHE_DIR, `${safe}.json`);
}

function readFileCache(url: string): CacheEntry | null {
  const p = filePath(url);
  if (!existsSync(p)) return null;
  try {
    const entry: CacheEntry = JSON.parse(readFileSync(p, 'utf-8'));
    if (Date.now() - entry.ts > TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeFileCache(url: string, data: OgpData | null): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const entry: CacheEntry = { data, ts: Date.now() };
  writeFileSync(filePath(url), JSON.stringify(entry));
}

// Dedupe in-flight fetches
const inflightMap = new Map<string, Promise<OgpData | null>>();

/** Fetch OGP with memory → file → network cache chain */
export async function fetchOgp(url: string): Promise<OgpData | null> {
  const mem = memoryCache.get(url);
  if (mem && Date.now() - mem.ts < TTL_MS) return mem.data;

  const file = readFileCache(url);
  if (file) {
    memoryCache.set(url, file);
    return file.data;
  }

  const inflight = inflightMap.get(url);
  if (inflight) return inflight;

  const promise = fetchOgpUncached(url).then((data) => {
    memoryCache.set(url, { data, ts: Date.now() });
    writeFileCache(url, data);
    inflightMap.delete(url);
    return data;
  });
  inflightMap.set(url, promise);
  return promise;
}

/** Batch-fetch OGP for multiple URLs in parallel */
export async function fetchOgpBatch(urls: string[]): Promise<Map<string, OgpData | null>> {
  const unique = [...new Set(urls)];
  const results = await Promise.all(unique.map(async (url) => [url, await fetchOgp(url)] as const));
  return new Map(results);
}

// --- fetch implementation ---

async function fetchOgpUncached(url: string): Promise<OgpData | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const base = new URL(url);

    const getMeta = (property: string): string => {
      const metaRe = /<meta([^>]+)>/gi;
      let m: RegExpExecArray | null;
      while ((m = metaRe.exec(html)) !== null) {
        const attrs = m[1];
        const prop =
          /property=["']([^"']*)["']/i.exec(attrs)?.[1] ?? /name=["']([^"']*)["']/i.exec(attrs)?.[1] ?? '';
        if (prop.toLowerCase() !== `og:${property}`) continue;
        const content = /content=["']([^"']*)["']/i.exec(attrs)?.[1];
        if (content !== undefined) return content;
      }
      return '';
    };

    const getFavicon = (): string | null => {
      const linkRe = /<link([^>]+)>/gi;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const attrs = m[1];
        if (!/rel=["'][^"']*icon[^"']*["']/i.test(attrs)) continue;
        const href = /href=["']([^"']*)["']/i.exec(attrs)?.[1];
        if (!href) continue;
        try {
          return new URL(href, base).href;
        } catch {}
      }
      return new URL('/favicon.ico', base).href;
    };

    const title = getMeta('title') || /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || url;

    return {
      title,
      description: getMeta('description'),
      image: getMeta('image'),
      imageWidth: Number.parseInt(getMeta('image:width'), 10) || undefined,
      imageHeight: Number.parseInt(getMeta('image:height'), 10) || undefined,
      favicon: getFavicon(),
      siteName: getMeta('site_name'),
      url,
    };
  } catch {
    return null;
  }
}
