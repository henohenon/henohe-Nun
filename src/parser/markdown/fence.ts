// Stateful code-fence tracker for parser pipeline stages.
export function createFenceTracker(): (line: string) => { inFence: boolean; isBoundary: boolean } {
  let marker = '';
  return (line: string) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    const wasInside = marker !== '';
    if (m) {
      const found = m[1];
      if (!wasInside) {
        marker = found;
        return { inFence: false, isBoundary: true };
      }
      if (found[0] === marker[0] && found.length >= marker.length) {
        marker = '';
        return { inFence: true, isBoundary: true };
      }
    }
    return { inFence: wasInside, isBoundary: false };
  };
}

export type TaggedLine = { raw: string; trimmed: string; fenced: boolean };

/** Iterate lines with fence-awareness. Fenced lines (including boundaries) are tagged. */
export function* taggedLines(lines: string[]): Generator<TaggedLine> {
  const fence = createFenceTracker();
  for (const raw of lines) {
    const { inFence, isBoundary } = fence(raw);
    yield { raw, trimmed: raw.trim(), fenced: inFence || isBoundary };
  }
}
