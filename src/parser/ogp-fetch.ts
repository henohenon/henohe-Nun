import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ogs from 'open-graph-scraper';

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

async function fetchOgpUncached(targetUrl: string): Promise<OgpData | null> {
  try {
    const { result } = await ogs({ url: targetUrl, timeout: 5000 });
    if (!result.success) return null;

    const image = result.ogImage?.[0];
    const favicon = result.favicon
      ? new URL(result.favicon, targetUrl).href
      : new URL('/favicon.ico', targetUrl).href;

    return {
      title: result.ogTitle || result.dcTitle || targetUrl,
      description: result.ogDescription || '',
      image: image?.url || '',
      imageWidth: image?.width ? Number(image.width) : undefined,
      imageHeight: image?.height ? Number(image.height) : undefined,
      favicon,
      siteName: result.ogSiteName || '',
      url: result.ogUrl || targetUrl,
    };
  } catch {
    return null;
  }
}
