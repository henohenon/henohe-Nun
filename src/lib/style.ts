import type { Attrs, AttrValue } from './types';

function pxUnit(v: AttrValue | undefined): string {
  if (typeof v !== 'string') return '';
  return /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}

// keyword → [y%, x%]
const POSITION_KEYWORDS: Record<string, [string | undefined, string | undefined]> = {
  top: ['0%', undefined],
  bottom: ['100%', undefined],
  left: [undefined, '0%'],
  right: [undefined, '100%'],
  center: ['50%', '50%'],
};

function buildFilters(attrs: Attrs): string[] {
  const filters: string[] = [];
  let colorize: string | undefined;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'mono' && v === true) filters.push('grayscale(1)');
    else if (k === 'bin' && v === true) filters.push('grayscale(1)', 'contrast(9999)');
    else if (k === 'sepia' && v === true) filters.push('sepia(1)');
    else if (k === 'invert' && v === true) filters.push('invert(1)');
    else if (k === 'blur' && typeof v === 'string') filters.push(`blur(${pxUnit(v)})`);
    else if (k === 'bright' && typeof v === 'string') filters.push(`brightness(${v})`);
    else if (k === 'contrast' && typeof v === 'string') filters.push(`contrast(${v})`);
    else if (k === 'saturate' && typeof v === 'string') filters.push(`saturate(${v})`);
    else if (k === 'hue' && typeof v === 'string') filters.push(`hue-rotate(${v})`);
    else if (k === 'shadow' && typeof v === 'string') filters.push(`drop-shadow(0 0 ${pxUnit(v)} var(--shadow))`);
    else if (k === 'c' && typeof v === 'string') colorize = v;
  }
  if (colorize) {
    filters.push('grayscale(1)', 'sepia(1)', `hue-rotate(${colorize})`);
  }
  return filters;
}

/** Combine a base position (from keyword) with an offset (from x/y) via calc(). */
function posCalc(base: string, offset: string | undefined): string {
  if (!offset) return base;
  return `calc(${base} + ${offset})`;
}

/** Common appearance: opacity, round, rotate, flip, filters. */
export function attrsToCommon(attrs: Attrs): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'o' && typeof v === 'string') parts.push(`opacity:${v}`);
    else if (k === 'rot' && typeof v === 'string') parts.push(`rotate:${v}`);
    else if (k === 'flip' && v === true) parts.push('scale:-1 1');
    else if (k === 'round' && typeof v === 'string') {
      parts.push(`border-radius:${pxUnit(v)}`, 'overflow:hidden');
    }
  }
  const filters = buildFilters(attrs);
  if (filters.length) parts.push(`filter:${filters.join(' ')}`);
  return parts.join(';');
}

/** Parse position keywords and x/y offsets from attrs. */
function parsePosition(attrs: Attrs) {
  let baseX: string | undefined;
  let baseY: string | undefined;
  let offsetX: string | undefined;
  let offsetY: string | undefined;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'x' && typeof v === 'string') offsetX = pxUnit(v);
    else if (k === 'y' && typeof v === 'string') offsetY = pxUnit(v);
    else if (k in POSITION_KEYWORDS && v === true) {
      const p = POSITION_KEYWORDS[k];
      if (p[0]) baseY = p[0];
      if (p[1]) baseX = p[1];
    }
  }
  const finalX = posCalc(baseX ?? '50%', offsetX);
  const finalY = posCalc(baseY ?? '50%', offsetY);
  return { finalX, finalY };
}

/** Background-image positioning: background-size + background-position. */
export function attrsToBackground(attrs: Attrs): string {
  const parts: string[] = [];
  let sizeW: string | undefined;
  let sizeH: string | undefined;
  let useCover = false;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'w' && typeof v === 'string') sizeW = pxUnit(v);
    else if (k === 'h' && typeof v === 'string') sizeH = pxUnit(v);
    else if (k === 'cover' && v === true) useCover = true;
  }
  const size = sizeW || sizeH ? `${sizeW ?? 'auto'} ${sizeH ?? 'auto'}` : useCover ? 'cover' : 'contain';
  parts.push(`background-size:${size}`);
  const { finalX, finalY } = parsePosition(attrs);
  parts.push(`background-position:${finalX} ${finalY}`);
  return parts.join(';');
}

/** <img> element positioning: object-fit/position + width/height. */
export function attrsToObject(attrs: Attrs): string {
  const parts: string[] = [];
  let sizeW: string | undefined;
  let sizeH: string | undefined;
  let useCover = false;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'w' && typeof v === 'string') sizeW = pxUnit(v);
    else if (k === 'h' && typeof v === 'string') sizeH = pxUnit(v);
    else if (k === 'cover' && v === true) useCover = true;
  }
  if (sizeW) parts.push(`width:${sizeW}`);
  if (sizeH) parts.push(`height:${sizeH}`);
  parts.push(`object-fit:${useCover ? 'cover' : 'contain'}`);
  const { finalX, finalY } = parsePosition(attrs);
  parts.push(`object-position:${finalX} ${finalY}`);
  return parts.join(';');
}
