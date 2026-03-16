// ─── Model routing ────────────────────────────────────────────────────────────

const VISION_RULES = new Set(['image-alt', 'image-redundant-alt', 'input-image-alt']);
const DETERMINISTIC_RULES = new Set(['color-contrast']);

export type ModelRoute = 'vision' | 'text' | 'deterministic';

export function getModelRoute(axeRuleId: string): ModelRoute {
  if (VISION_RULES.has(axeRuleId)) return 'vision';
  if (DETERMINISTIC_RULES.has(axeRuleId)) return 'deterministic';
  return 'text';
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildImageAltPrompt(pageUrl: string): string {
  return `Describe this image in a single sentence for use as alt text. Be specific and concise.
If the image is purely decorative (a divider, background pattern, or generic stock photo), respond with exactly: decorative

This image appears on: ${pageUrl}`;
}

export function buildTextFixPrompt(params: {
  description: string;
  wcagCriteria: string | null;
  elementHtml: string;
  pageUrl: string;
  cmsType: string;
}): string {
  const truncatedHtml = params.elementHtml.slice(0, 500);
  return `You are an accessibility remediation assistant for a ${params.cmsType} website.

Issue: ${params.description}
WCAG: ${params.wcagCriteria || 'N/A'}
Element HTML: ${truncatedHtml}
Page URL: ${params.pageUrl}

Provide a specific, actionable fix in 1-2 sentences. If suggesting text content (link text, button label, heading), provide the exact text to use. If suggesting a code change, provide the exact attribute or CSS value. Do not include any preamble or explanation.`;
}

// ─── Color contrast calculation ───────────────────────────────────────────────

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

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
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

// ─── DeepInfra API calls ──────────────────────────────────────────────────────

const DEEPINFRA_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const VISION_MODEL = 'Qwen/Qwen3-VL-235B-A22B-Instruct';
const TEXT_MODEL = 'deepseek-ai/DeepSeek-V3.2';

export async function generateImageAltText(
  imageUrl: string,
  pageUrl: string,
): Promise<string | null> {
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(DEEPINFRA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildImageAltPrompt(pageUrl) },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(`Rate limited: ${res.status}`);
      }
      console.error(`[ai-fix] vision model error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';

    // Strip <think> tags from Qwen3-VL reasoning output
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Handle decorative images
    if (cleaned.toLowerCase() === 'decorative') {
      return 'alt=""';
    }

    return cleaned || null;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Rate limited')) throw err;
    console.error('[ai-fix] vision model call failed:', err);
    return null;
  }
}

export async function generateTextFix(params: {
  description: string;
  wcagCriteria: string | null;
  elementHtml: string;
  pageUrl: string;
  cmsType: string;
}): Promise<string | null> {
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(DEEPINFRA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: 'user', content: buildTextFixPrompt(params) }],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(`Rate limited: ${res.status}`);
      }
      console.error(`[ai-fix] text model error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Rate limited')) throw err;
    console.error('[ai-fix] text model call failed:', err);
    return null;
  }
}

// ─── Extract image URL from element HTML ──────────────────────────────────────

export function extractImageUrl(elementHtml: string, pageUrl: string): string | null {
  const srcMatch = elementHtml.match(/src=["']([^"']+)["']/);
  if (!srcMatch) return null;

  const src = srcMatch[1];
  // Resolve relative URLs
  try {
    return new URL(src, pageUrl).href;
  } catch {
    return null;
  }
}

// ─── Parse contrast colors from axe data ──────────────────────────────────────

export function parseContrastColors(
  description: string,
): { fg: string; bg: string; isLargeText: boolean } | null {
  const fgMatch = description.match(/foreground color:\s*(#[0-9a-fA-F]{6})/);
  const bgMatch = description.match(/background color:\s*(#[0-9a-fA-F]{6})/);
  if (!fgMatch || !bgMatch) return null;

  const isLargeText = description.includes('large text') ||
    description.includes('font-size: 18') ||
    (description.includes('font-size: 14') && description.includes('font-weight: bold'));

  return { fg: fgMatch[1], bg: bgMatch[1], isLargeText };
}

// ─── Main entry point for generating a fix suggestion ─────────────────────────

export async function generateFixSuggestion(issue: {
  axeRuleId: string;
  description: string;
  elementHtml: string;
  wcagCriteria: string | null;
  pageUrl: string;
  cmsType: string;
}): Promise<{ suggestion: string | null; model: string }> {
  const route = getModelRoute(issue.axeRuleId);

  if (route === 'deterministic') {
    const colors = parseContrastColors(issue.description);
    if (!colors) return { suggestion: null, model: 'deterministic' };

    const targetRatio = colors.isLargeText ? 3.0 : 4.5;
    const result = computeCompliantColor(colors.fg, colors.bg, targetRatio);
    if (!result) return { suggestion: null, model: 'deterministic' };

    return {
      suggestion: `Change color from ${colors.fg} to ${result.newColor} (contrast ratio: ${result.ratio}:1)`,
      model: 'deterministic',
    };
  }

  if (route === 'vision') {
    const imageUrl = extractImageUrl(issue.elementHtml, issue.pageUrl);
    if (!imageUrl) {
      // Fall back to text model if we can't extract an image URL
      const text = await generateTextFix(issue);
      return { suggestion: text, model: 'deepseek' };
    }
    const altText = await generateImageAltText(imageUrl, issue.pageUrl);
    return { suggestion: altText, model: 'qwen-vl' };
  }

  // Text model
  const text = await generateTextFix(issue);
  return { suggestion: text, model: 'deepseek' };
}
