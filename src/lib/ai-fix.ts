import { computeCompliantColor } from './color-contrast';
export { computeCompliantColor } from './color-contrast';

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
