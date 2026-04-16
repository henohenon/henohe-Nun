// Shared syntax patterns for the 5 Nun markup types

export const CLASS_RE = /^(\.[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)*)$/;
export const VAR_RE = /^\$([a-zA-Z][\w-]*):\s*(.+)$/;
export const TEMPLATE_RE = /^\u{1F30A}(\w+)\s*$/u;
export const H1_RE = /^#\s+(.*)$/;
export const H2_RE = /^##\s*(.*)$/;
export const TILDE_RE = /^(.+)~(\w+(?:\.\w[\w-]*)*)$/;
export const MD_IMG_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
export const LINK_CARD_RE = /^\[([^\]]*)\]\(([^)]+)\)~card(?:\.\w+)*$/;

export function parseClasses(dotted: string): string[] {
  return dotted.split('.').filter(Boolean);
}

export function parseTildeOptions(raw: string): { key: string; options: string[] } {
  const parts = raw.split('.');
  return { key: parts[0], options: parts.slice(1) };
}
