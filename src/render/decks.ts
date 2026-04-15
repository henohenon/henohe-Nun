// Deck file enumeration helpers (shared by dev app and SSG build)

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Recursively list .md files under a directory, returning relative paths without .md */
export function listDecks(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listDecks(join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.md')) {
      out.push(rel.replace(/\.md$/, ''));
    }
  }
  return out.sort();
}

/** Read a deck's markdown source, or null if not found */
export function readDeckMd(benbenDir: string, deckName: string): string | null {
  const path = join(benbenDir, `${deckName}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}
