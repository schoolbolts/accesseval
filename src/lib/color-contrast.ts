// ─── Color contrast calculation utilities ────────────────────────────────────
// Shared between the scanner (deterministic fix generation) and the UI
// (contrast panel display).

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastRatioFromHex(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(...hexToRgb(hex1));
  const l2 = relativeLuminance(...hexToRgb(hex2));
  return Math.round(contrastRatio(l1, l2) * 100) / 100;
}

export function hexToHsl(hex: string): [number, number, number] {
  return rgbToHsl(...hexToRgb(hex));
}

export function hslToHex(h: number, s: number, l: number): string {
  return rgbToHex(...hslToRgb(h, s, l));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

export function computeCompliantColor(
  fgHex: string,
  bgHex: string,
  targetRatio: number,
): { newColor: string; ratio: number } | null {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const bgLum = relativeLuminance(...bg);
  const fgLum = relativeLuminance(...fg);
  const currentRatio = contrastRatio(fgLum, bgLum);

  if (currentRatio >= targetRatio) return null;

  // Adjust lightness in HSL space
  const [h, s, l] = rgbToHsl(...fg);
  const needsDarker = bgLum > 0.5; // light bg → darken fg

  let newL = l;
  const step = 0.01;
  for (let i = 0; i < 100; i++) {
    newL = needsDarker ? newL - step : newL + step;
    if (newL < 0 || newL > 1) break;
    const [r, g, b] = hslToRgb(h, s, newL);
    const newLum = relativeLuminance(r, g, b);
    const ratio = contrastRatio(newLum, bgLum);
    if (ratio >= targetRatio) {
      return { newColor: rgbToHex(r, g, b), ratio: Math.round(ratio * 100) / 100 };
    }
  }

  // Fallback: use black or white
  const blackRatio = contrastRatio(0, bgLum);
  const whiteRatio = contrastRatio(1, bgLum);
  if (blackRatio >= targetRatio) {
    return { newColor: '#000000', ratio: Math.round(blackRatio * 100) / 100 };
  }
  return { newColor: '#ffffff', ratio: Math.round(whiteRatio * 100) / 100 };
}

/**
 * Parse color contrast check data from axe-core into a display-ready format.
 * Returns null if the data doesn't contain color information.
 */
export function parseContrastCheckData(checkData: unknown): ContrastInfo | null {
  if (!checkData || typeof checkData !== 'object') return null;
  const data = checkData as Record<string, unknown>;
  const fg = data.fgColor as string | undefined;
  const bg = data.bgColor as string | undefined;
  if (!fg || !bg) return null;

  const currentRatio = typeof data.contrastRatio === 'number'
    ? Math.round(data.contrastRatio * 100) / 100
    : contrastRatioFromHex(fg, bg);

  const fontSize = data.fontSize as string | undefined;
  const fontWeight = data.fontWeight as string | undefined;

  // Large text: 18px+ or 14px+ bold
  const sizeNum = fontSize ? parseFloat(fontSize) : 0;
  const isBold = fontWeight === 'bold' || Number(fontWeight) >= 700;
  const isLargeText = sizeNum >= 18 || (sizeNum >= 14 && isBold);

  const expectedRatio = typeof data.expectedContrastRatio === 'number'
    ? data.expectedContrastRatio
    : (isLargeText ? 3 : 4.5);

  const suggested = computeCompliantColor(fg, bg, expectedRatio);

  return {
    fgColor: fg,
    bgColor: bg,
    currentRatio,
    expectedRatio,
    fontSize: fontSize ?? null,
    fontWeight: fontWeight ?? null,
    isLargeText,
    suggestedColor: suggested?.newColor ?? null,
    suggestedRatio: suggested?.ratio ?? null,
  };
}

export interface ContrastInfo {
  fgColor: string;
  bgColor: string;
  currentRatio: number;
  expectedRatio: number;
  fontSize: string | null;
  fontWeight: string | null;
  isLargeText: boolean;
  suggestedColor: string | null;
  suggestedRatio: number | null;
}
