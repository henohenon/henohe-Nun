import type { Attrs, AttrValue } from './types';

const PX_KEYS = new Set(['w', 'h', 'x', 'y', 'm', 'mt', 'mb', 'ml', 'mr', 'p', 'pt', 'pb', 'pl', 'pr', 's']);

function pxUnit(v: AttrValue | undefined): string {
  if (typeof v !== 'string') return '';
  return /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}

const CSS_MAP: Record<string, string> = {
  w: 'width',
  h: 'height',
  m: 'margin',
  mt: 'margin-top',
  mb: 'margin-bottom',
  ml: 'margin-left',
  mr: 'margin-right',
  p: 'padding',
  pt: 'padding-top',
  pb: 'padding-bottom',
  pl: 'padding-left',
  pr: 'padding-right',
  align: 'align-items',
  justify: 'justify-content',
  s: 'font-size',
  c: 'color',
  o: 'opacity',
  bc: 'background-color',
};

const COLOR_KEYS = new Set([
  'white',
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'gray',
  'lightgray',
]);

const LAYOUT_PLACE: Record<string, [string | undefined, string | undefined]> = {
  top: ['start', undefined],
  bottom: ['end', undefined],
  left: [undefined, 'start'],
  right: [undefined, 'end'],
  center: ['center', 'center'],
};

const TEXT_ALIGN: Record<string, string> = {
  tl: 'left',
  tr: 'right',
  tc: 'center',
};

export function attrsToStyle(attrs: Attrs): string {
  const parts: string[] = [];
  const filters: string[] = [];
  let layoutVert: string | undefined;
  let layoutHoriz: string | undefined;
  let tx: string | undefined;
  let ty: string | undefined;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'x' && typeof v === 'string') {
      tx = pxUnit(v);
      continue;
    }
    if (k === 'y' && typeof v === 'string') {
      ty = pxUnit(v);
      continue;
    }
    if (k === 'b' && v === true) parts.push('font-weight:bold', 'color:var(--theme-color)');
    else if (k === 'i' && v === true) parts.push('font-style:italic');
    else if (COLOR_KEYS.has(k) && v === true) parts.push(`color:${k}`);
    else if (k in LAYOUT_PLACE && v === true) {
      const l = LAYOUT_PLACE[k];
      layoutVert = l[0] ?? layoutVert;
      layoutHoriz = l[1] ?? layoutHoriz;
    } else if (k in TEXT_ALIGN && v === true) {
      parts.push(`text-align:${TEXT_ALIGN[k]}`);
    } else if (k === 'blur' && typeof v === 'string') {
      filters.push(`blur(${pxUnit(v)})`);
    } else if (k === 'mono' && v === true) {
      filters.push('grayscale(1)');
    } else if (k === 'bin' && v === true) {
      filters.push('grayscale(1)', 'contrast(9999)');
    } else if (k === 'sepia' && v === true) {
      filters.push('sepia(1)');
    } else if (k === 'invert' && v === true) {
      filters.push('invert(1)');
    } else if (k === 'bright' && typeof v === 'string') {
      filters.push(`brightness(${v})`);
    } else if (k === 'contrast' && typeof v === 'string') {
      filters.push(`contrast(${v})`);
    } else if (k === 'saturate' && typeof v === 'string') {
      filters.push(`saturate(${v})`);
    } else if (k === 'hue' && typeof v === 'string') {
      filters.push(`hue-rotate(${v})`);
    } else if (k === 'round' && typeof v === 'string') {
      parts.push(`border-radius:${pxUnit(v)}`);
      parts.push('overflow:hidden');
    } else if (k in CSS_MAP && typeof v === 'string') {
      const cssKey = CSS_MAP[k];
      const cssVal = PX_KEYS.has(k) ? pxUnit(v) : v;
      parts.push(`${cssKey}:${cssVal}`);
    }
  }
  if (filters.length) parts.push(`filter:${filters.join(' ')}`);
  if (tx !== undefined || ty !== undefined) {
    parts.push(`translate:${tx ?? '0'} ${ty ?? '0'}`);
  }
  if (layoutVert || layoutHoriz) {
    const h = layoutHoriz ?? 'center';
    const v = layoutVert ?? 'center';
    parts.push(`place-self:${v} ${h}`);
  }
  return parts.join(';');
}
