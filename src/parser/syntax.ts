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

// --- Line classification ---

export type LineSyntax =
  | { syntax: 'h1'; heading: string; raw: string }
  | { syntax: 'h2'; heading: string; raw: string }
  | { syntax: 'class'; classes: string[]; raw: string }
  | { syntax: 'var'; name: string; value: string; raw: string }
  | { syntax: 'template'; name: string; raw: string }
  | { syntax: 'tilde'; value: string; key: string; options: string[]; raw: string }
  | { syntax: 'fenced'; raw: string }
  | { syntax: 'content'; raw: string }
  | { syntax: 'blank'; raw: string };

/** Classify a single non-fenced line by its syntactic form. */
export function classifyLine(trimmed: string, raw: string): LineSyntax {
  if (trimmed === '') return { syntax: 'blank', raw };

  if (!trimmed.startsWith('##')) {
    const h1 = H1_RE.exec(trimmed);
    if (h1) return { syntax: 'h1', heading: h1[1], raw };
  }

  if ((trimmed.startsWith('## ') || trimmed === '##') && !trimmed.startsWith('###')) {
    const h2 = H2_RE.exec(trimmed);
    return { syntax: 'h2', heading: h2?.[1]?.trim() ?? '', raw };
  }

  const cm = CLASS_RE.exec(trimmed);
  if (cm) return { syntax: 'class', classes: parseClasses(cm[1]), raw };

  const vm = VAR_RE.exec(trimmed);
  if (vm) return { syntax: 'var', name: vm[1], value: vm[2].trim(), raw };

  const tm = TEMPLATE_RE.exec(trimmed);
  if (tm) return { syntax: 'template', name: tm[1], raw };

  const tl = TILDE_RE.exec(trimmed);
  if (tl) {
    const { key, options } = parseTildeOptions(tl[2]);
    return { syntax: 'tilde', value: tl[1].trim(), key, options, raw };
  }

  return { syntax: 'content', raw };
}
