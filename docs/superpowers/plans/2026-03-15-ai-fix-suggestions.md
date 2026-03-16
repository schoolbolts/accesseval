# AI Fix Suggestions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-generated, context-specific fix suggestions to each accessibility issue — vision model for image alt text, text model for non-image issues, deterministic calculation for color contrast.

**Architecture:** Two-phase pipeline: Phase 1 (existing scan) produces issues with static fix instructions, Phase 2 (new async job) enriches issues with AI suggestions. Free scans run AI inline. Issues are deduplicated by fingerprint before AI calls. Model routing: Qwen3-VL for images, DeepSeek for text, deterministic HSL calculation for contrast. All API calls go through DeepInfra (existing provider).

**Tech Stack:** Next.js 14 App Router, Prisma/PostgreSQL, BullMQ, DeepInfra API (Qwen3-VL-235B, DeepSeek-V3.2), Vitest

**Spec:** `docs/superpowers/specs/2026-03-15-ai-fix-suggestions-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add 3 columns to Issue model (aiFixSuggestion, aiFixModel, aiFixGeneratedAt) |
| `src/lib/ai-fix.ts` | Create | AI model routing, prompt building, DeepInfra calls, contrast calculation |
| `tests/unit/ai-fix.test.ts` | Create | Unit tests for contrast calculation, model routing, prompt building |
| `src/lib/queue.ts` | Modify | Add `aiEnrichmentQueue` |
| `worker/jobs/ai-fix-suggestions.ts` | Create | BullMQ job — iterates issues, deduplicates by fingerprint, calls AI, stores results |
| `worker/jobs/full-scan.ts` | Modify | Queue AI enrichment job after Phase 5 (scoring) |
| `worker/jobs/free-scan.ts` | Modify | Run AI suggestions inline for top 5 issues |
| `worker/index.ts` | Modify | Register `ai-enrichment` queue worker |
| `src/lib/plan-limits.ts` | Already done | `aiFixSuggestions` flag already added in tier restructure |
| `src/components/issues/issues-list.tsx` | Modify | Add `aiFixSuggestion` to IssueItem, render suggestion block |
| `src/app/(dashboard)/pages/[pageId]/page.tsx` | Modify | Pass `aiFixSuggestion` through to issues, render in grouped view |
| `src/components/scan/scan-progress.tsx` | Modify | Render AI suggestion in free scan results |
| `src/app/api/scan/free/[token]/route.ts` | Modify | Pass `aiFixSuggestion` in response |

---

## Chunk 1: Core AI Logic

### Task 1: Add AI fix columns to Issue model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add three new fields to the Issue model**

In `prisma/schema.prisma`, add three fields to the `Issue` model after `fingerprint` (line 235) and before `createdAt` (line 236):

```prisma
  aiFixSuggestion    String?   @map("ai_fix_suggestion")
  aiFixModel         String?   @map("ai_fix_model")
  aiFixGeneratedAt   DateTime? @map("ai_fix_generated_at")
```

- [ ] **Step 2: Create migration file**

Create `prisma/migrations/20260315300000_add_ai_fix_columns/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "issues" ADD COLUMN "ai_fix_suggestion" TEXT,
ADD COLUMN "ai_fix_model" TEXT,
ADD COLUMN "ai_fix_generated_at" TIMESTAMP(3);
```

- [ ] **Step 3: Regenerate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260315300000_add_ai_fix_columns/
git commit -m "feat: add aiFixSuggestion, aiFixModel, aiFixGeneratedAt columns to Issue"
```

---

### Task 2: Create ai-fix.ts — model routing, prompts, contrast calculation

**Files:**
- Create: `src/lib/ai-fix.ts`
- Create: `tests/unit/ai-fix.test.ts`

This is the core module. It handles:
1. Determining which model to use based on axe rule ID
2. Building prompts for each model type
3. Calling DeepInfra API
4. Deterministic color contrast calculation (no LLM)

- [ ] **Step 1: Write tests for contrast calculation and model routing**

Create `tests/unit/ai-fix.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getModelRoute,
  computeCompliantColor,
  buildImageAltPrompt,
  buildTextFixPrompt,
  parseContrastColors,
  extractImageUrl,
} from '../../src/lib/ai-fix';

describe('getModelRoute', () => {
  it('routes image-alt to vision', () => {
    expect(getModelRoute('image-alt')).toBe('vision');
  });

  it('routes image-redundant-alt to vision', () => {
    expect(getModelRoute('image-redundant-alt')).toBe('vision');
  });

  it('routes color-contrast to deterministic', () => {
    expect(getModelRoute('color-contrast')).toBe('deterministic');
  });

  it('routes link-name to text', () => {
    expect(getModelRoute('link-name')).toBe('text');
  });

  it('routes button-name to text', () => {
    expect(getModelRoute('button-name')).toBe('text');
  });

  it('routes heading-order to text', () => {
    expect(getModelRoute('heading-order')).toBe('text');
  });

  it('routes aria rules to text', () => {
    expect(getModelRoute('aria-required-attr')).toBe('text');
  });

  it('routes unknown rules to text', () => {
    expect(getModelRoute('some-unknown-rule')).toBe('text');
  });
});

describe('computeCompliantColor', () => {
  it('returns a darker foreground when contrast is too low', () => {
    // Light gray on white — needs to be darkened
    const result = computeCompliantColor('#999999', '#ffffff', 4.5);
    expect(result).toBeDefined();
    expect(result!.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result!.newColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('returns null if foreground already meets ratio', () => {
    // Black on white — already meets any ratio
    const result = computeCompliantColor('#000000', '#ffffff', 4.5);
    expect(result).toBeNull();
  });

  it('handles large text ratio (3:1)', () => {
    const result = computeCompliantColor('#aaaaaa', '#ffffff', 3.0);
    expect(result).toBeDefined();
    expect(result!.ratio).toBeGreaterThanOrEqual(3.0);
  });
});

describe('buildImageAltPrompt', () => {
  it('includes page URL context', () => {
    const prompt = buildImageAltPrompt('https://example.com/about');
    expect(prompt).toContain('https://example.com/about');
  });
});

describe('buildTextFixPrompt', () => {
  it('includes element HTML and description', () => {
    const prompt = buildTextFixPrompt({
      description: 'Link text is empty',
      wcagCriteria: '2.4.4',
      elementHtml: '<a href="/about"></a>',
      pageUrl: 'https://example.com',
      cmsType: 'wordpress',
    });
    expect(prompt).toContain('<a href="/about"></a>');
    expect(prompt).toContain('Link text is empty');
    expect(prompt).toContain('wordpress');
  });

  it('truncates elementHtml to 500 chars', () => {
    const longHtml = '<div>' + 'x'.repeat(600) + '</div>';
    const prompt = buildTextFixPrompt({
      description: 'Test',
      wcagCriteria: null,
      elementHtml: longHtml,
      pageUrl: 'https://example.com',
      cmsType: 'unknown',
    });
    // The embedded HTML should be at most 500 characters
    expect(prompt).not.toContain('x'.repeat(501));
    expect(prompt).toContain('x'.repeat(500));
  });
});

describe('parseContrastColors', () => {
  it('extracts foreground and background hex colors from description', () => {
    const result = parseContrastColors(
      'Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font-size: 16px)'
    );
    expect(result).toEqual({ fg: '#94a3b8', bg: '#ffffff', isLargeText: false });
  });

  it('detects large text', () => {
    const result = parseContrastColors(
      'Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font-size: 18px, large text)'
    );
    expect(result).toBeDefined();
    expect(result!.isLargeText).toBe(true);
  });

  it('returns null when colors cannot be parsed', () => {
    const result = parseContrastColors('No color information here');
    expect(result).toBeNull();
  });
});

describe('extractImageUrl', () => {
  it('extracts absolute image src', () => {
    const url = extractImageUrl('<img src="https://cdn.example.com/photo.jpg" />', 'https://example.com');
    expect(url).toBe('https://cdn.example.com/photo.jpg');
  });

  it('resolves relative image src', () => {
    const url = extractImageUrl('<img src="/images/photo.jpg" />', 'https://example.com/about');
    expect(url).toBe('https://example.com/images/photo.jpg');
  });

  it('returns null when no src attribute', () => {
    const url = extractImageUrl('<img alt="test" />', 'https://example.com');
    expect(url).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/ai-fix.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create src/lib/ai-fix.ts**

```typescript
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
      console.error(`[ai-fix] vision model error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';

    // Handle decorative images
    if (text.toLowerCase() === 'decorative') {
      return 'alt=""';
    }

    return text || null;
  } catch (err) {
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
      console.error(`[ai-fix] text model error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
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
  // axe-core descriptions include color values like:
  // "Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, ...)"
  const fgMatch = description.match(/foreground color:\s*(#[0-9a-fA-F]{6})/);
  const bgMatch = description.match(/background color:\s*(#[0-9a-fA-F]{6})/);
  if (!fgMatch || !bgMatch) return null;

  const isLargeText = description.includes('large text') ||
    description.includes('font-size: 18') ||
    description.includes('font-size: 14') && description.includes('font-weight: bold');

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/ai-fix.test.ts`
Expected: All tests PASS. (API-calling functions are not tested — they require live API keys.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai-fix.ts tests/unit/ai-fix.test.ts
git commit -m "feat: add ai-fix module — model routing, prompts, contrast calculation, DeepInfra calls"
```

---

## Chunk 2: Worker Jobs

### Task 3: Add aiEnrichmentQueue to queue.ts

**Files:**
- Modify: `src/lib/queue.ts`

- [ ] **Step 1: Add the new queue**

In `src/lib/queue.ts`, add after the `freeScanQueue` definition (after line 30):

```typescript
export const aiEnrichmentQueue = new Queue('ai-enrichment', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queue.ts
git commit -m "feat: add aiEnrichmentQueue to BullMQ queues"
```

---

### Task 4: Create AI enrichment worker job

**Files:**
- Create: `worker/jobs/ai-fix-suggestions.ts`

- [ ] **Step 1: Create the worker job**

Create `worker/jobs/ai-fix-suggestions.ts`:

```typescript
import { prisma } from '../../src/lib/db';
import { generateFixSuggestion } from '../../src/lib/ai-fix';

export interface AiEnrichmentJobData {
  scanId: string;
}

const MAX_UNIQUE_FINGERPRINTS = 200;
const CONCURRENCY = 5;

export async function processAiEnrichment(data: AiEnrichmentJobData): Promise<void> {
  const { scanId } = data;

  // Load all issues for this scan
  const issues = await prisma.issue.findMany({
    where: { scanId },
    select: {
      id: true,
      axeRuleId: true,
      severity: true,
      description: true,
      elementHtml: true,
      wcagCriteria: true,
      fingerprint: true,
      page: { select: { url: true } },
      scan: { select: { site: { select: { cmsType: true, url: true } } } },
    },
    orderBy: [
      { severity: 'asc' }, // critical first (enum order)
    ],
  });

  if (issues.length === 0) return;

  // Deduplicate by fingerprint — only generate one suggestion per unique fingerprint
  const fingerprintGroups = new Map<string, typeof issues>();
  for (const issue of issues) {
    const group = fingerprintGroups.get(issue.fingerprint) ?? [];
    group.push(issue);
    fingerprintGroups.set(issue.fingerprint, group);
  }

  // Cap at MAX_UNIQUE_FINGERPRINTS (prioritized by severity from the sort above)
  const uniqueFingerprints = Array.from(fingerprintGroups.entries()).slice(0, MAX_UNIQUE_FINGERPRINTS);

  console.log(`[ai-enrichment] scan=${scanId} total=${issues.length} unique=${uniqueFingerprints.length}`);

  // Check cross-scan cache: reuse suggestions from previous scans with same fingerprint
  const allFingerprints = uniqueFingerprints.map(([fp]) => fp);
  const cachedIssues = await prisma.issue.findMany({
    where: {
      fingerprint: { in: allFingerprints },
      aiFixSuggestion: { not: null },
      scanId: { not: scanId },
    },
    select: { fingerprint: true, aiFixSuggestion: true, aiFixModel: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const cachedSuggestions = new Map<string, { suggestion: string; model: string }>();
  for (const cached of cachedIssues) {
    if (!cachedSuggestions.has(cached.fingerprint)) {
      cachedSuggestions.set(cached.fingerprint, {
        suggestion: cached.aiFixSuggestion!,
        model: cached.aiFixModel ?? 'cached',
      });
    }
  }

  console.log(`[ai-enrichment] scan=${scanId} cached=${cachedSuggestions.size}`);

  // Process in batches of CONCURRENCY
  const toProcess = uniqueFingerprints.filter(([fp]) => !cachedSuggestions.has(fp));

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async ([fingerprint, group]) => {
        const representative = group[0];

        // Retry up to 3 times with exponential backoff on rate-limit errors
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { suggestion, model } = await generateFixSuggestion({
              axeRuleId: representative.axeRuleId,
              description: representative.description,
              elementHtml: representative.elementHtml,
              wcagCriteria: representative.wcagCriteria,
              pageUrl: representative.page.url,
              cmsType: representative.scan.site.cmsType,
            });

            if (suggestion) {
              await prisma.issue.updateMany({
                where: { scanId, fingerprint },
                data: {
                  aiFixSuggestion: suggestion,
                  aiFixModel: model,
                  aiFixGeneratedAt: new Date(),
                },
              });
            }
            return; // Success — exit retry loop
          } catch (err: unknown) {
            const isRateLimit = err instanceof Error && err.message.includes('429');
            if (isRateLimit && attempt < 2) {
              const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
              console.warn(`[ai-enrichment] rate-limited, retrying in ${delay}ms...`);
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            console.warn(`[ai-enrichment] failed for fingerprint=${fingerprint.slice(0, 8)}:`, err);
            return;
          }
        }
      })
    );

    // Log any rejected promises for observability
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[ai-enrichment] unexpected rejection:', result.reason);
      }
    }
  }

  // Apply cached suggestions
  for (const [fingerprint, cached] of cachedSuggestions) {
    await prisma.issue.updateMany({
      where: { scanId, fingerprint },
      data: {
        aiFixSuggestion: cached.suggestion,
        aiFixModel: cached.model,
        aiFixGeneratedAt: new Date(),
      },
    });
  }

  console.log(`[ai-enrichment] scan=${scanId} complete`);
}
```

- [ ] **Step 2: Commit**

```bash
git add worker/jobs/ai-fix-suggestions.ts
git commit -m "feat: add AI enrichment worker job — deduplicates by fingerprint, routes to models"
```

---

### Task 5: Queue AI enrichment from full-scan job

**Files:**
- Modify: `worker/jobs/full-scan.ts`

- [ ] **Step 1: Import the queue and queue the job**

In `worker/jobs/full-scan.ts`, add imports at the top:

```typescript
import { aiEnrichmentQueue } from '../../src/lib/queue';
import { canUseFeature } from '../../src/lib/plan-limits';
```

Then find Phase 5b (the AI summary generation step, after `generateScanSummary` is called) and add after it:

```typescript
    // Phase 5c: Queue AI fix suggestion enrichment (Fix tier only)
    if (canUseFeature(site.organization.plan, 'aiFixSuggestions')) {
      console.log(`[scan] ${scanId} queuing AI fix enrichment`);
      await aiEnrichmentQueue.add('ai-enrichment', { scanId }, {
        jobId: `ai-enrichment-${scanId}`,
      });
    }
```

Note: This queues the AI enrichment job but does not block the scan completion notification (Phase 7). The scan complete email will fire before AI suggestions are populated. This is intentional — per the spec, "AI suggestions appear on next page load once Phase 2 completes." Users see static fix instructions immediately and AI suggestions appear asynchronously.

- [ ] **Step 2: Commit**

```bash
git add worker/jobs/full-scan.ts
git commit -m "feat: queue AI enrichment job after full scan completes"
```

---

### Task 6: Run AI suggestions inline for free scans

**Files:**
- Modify: `worker/jobs/free-scan.ts`

- [ ] **Step 1: Add inline AI fix suggestions**

In `worker/jobs/free-scan.ts`, add an import at the top:

```typescript
import { generateFixSuggestion } from '../../src/lib/ai-fix';
```

After the AI narrative generation block (after `narrative = await generateFreeScanSummary(...)`, around line 121) and before the final `prisma.freeScan.update`, add:

```typescript
  // Generate AI fix suggestions for each top issue (inline, not queued)
  const cmsType = scanResult.detectedCms ?? 'unknown';
  for (let i = 0; i < topIssues.length; i++) {
    try {
      const issue = topIssues[i];
      const { suggestion } = await generateFixSuggestion({
        axeRuleId: issue.axeRuleId,
        description: issue.description,
        elementHtml: issue.elementHtml,
        wcagCriteria: issue.wcagCriteria ?? null,
        pageUrl: url,
        cmsType,
      });
      if (suggestion) {
        (topIssues[i] as Record<string, unknown>).aiFixSuggestion = suggestion;
      }
    } catch (err) {
      console.warn(`[free-scan] ${freeScanId} AI fix suggestion ${i} failed:`, err);
    }
  }
```

This adds `aiFixSuggestion` to each issue object in the `topIssues` array before it's saved to `resultsJson`.

- [ ] **Step 2: Commit**

```bash
git add worker/jobs/free-scan.ts
git commit -m "feat: run AI fix suggestions inline for free scans"
```

---

### Task 7: Register AI enrichment worker

**Files:**
- Modify: `worker/index.ts`

- [ ] **Step 1: Import and create the worker**

In `worker/index.ts`, add the import at the top (after line 4):

```typescript
import { processAiEnrichment, type AiEnrichmentJobData } from './jobs/ai-fix-suggestions';
```

After the `freeScanWorker` definition (line 24, before the `// --- Cron jobs` comment on line 26), add:

```typescript
const aiEnrichmentWorker = createWorker<AiEnrichmentJobData>('ai-enrichment', async (job) => {
  await processAiEnrichment(job.data);
}, 2);
```

In the SIGTERM handler (line 57), add `await aiEnrichmentWorker.close();` after `await freeScanWorker.close();` (line 59) and before `await cronWorker.close();` (line 60).

- [ ] **Step 2: Commit**

```bash
git add worker/index.ts
git commit -m "feat: register ai-enrichment queue worker"
```

---

## Chunk 3: UI — Display AI Suggestions

### Task 8: Update issues-list.tsx — render AI suggestion block

**Files:**
- Modify: `src/components/issues/issues-list.tsx`

- [ ] **Step 1: Add aiFixSuggestion to IssueItem interface**

In `src/components/issues/issues-list.tsx`, update the `IssueItem` interface (line 7) to add:

```typescript
  aiFixSuggestion: string | null;
```

Add a new prop to `IssuesListProps`:

```typescript
interface IssuesListProps {
  issues: IssueItem[];
  showCmsInstructions: boolean;
  showAiSuggestions: boolean;
}
```

Update the function signature:

```typescript
export default function IssuesList({ issues, showCmsInstructions, showAiSuggestions }: IssuesListProps) {
```

- [ ] **Step 2: Render the AI suggestion block in the expanded details**

In the expanded details section, after the CMS fix instructions block (after line 177) and before the "Element selector" block (line 179), add:

```tsx
                    {showAiSuggestions && issue.aiFixSuggestion && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="section-title text-emerald-800">Suggested fix</h4>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(issue.aiFixSuggestion!)}
                            className="text-xs font-body text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-sm font-body text-emerald-900 leading-relaxed">
                          {issue.aiFixSuggestion}
                        </p>
                      </div>
                    )}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/issues-list.tsx
git commit -m "feat: render AI fix suggestion block in issues list"
```

---

### Task 9: Update page detail view to pass AI suggestions

**Files:**
- Modify: `src/app/(dashboard)/pages/[pageId]/page.tsx`

- [ ] **Step 1: Include aiFixSuggestion in the issue query and add showAiSuggestions**

In `src/app/(dashboard)/pages/[pageId]/page.tsx`, add `aiFixSuggestion: true` to the `prisma.issue.findMany` select (line 70-81, after `wcagCriteria: true` on line 79):

```typescript
      wcagCriteria: true,
      aiFixSuggestion: true,
```

After `const showCms = canUseFeature(plan, 'cmsFixInstructions');` (line 52), add:

```typescript
  const showAiSuggestions = canUseFeature(plan, 'aiFixSuggestions');
```

(`canUseFeature` is already imported on line 7.)

- [ ] **Step 2: Render AI suggestion block in grouped view (first instance only)**

This page renders issues grouped by axeRuleId. The fix instructions and CMS block are both gated with `idx === 0` (lines 221-232). Add the AI suggestion block after the CMS instructions block (after line 232, before the `<div className="space-y-2">` on line 234), matching the `idx === 0` pattern:

```tsx
                    {idx === 0 && showAiSuggestions && issue.aiFixSuggestion && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl px-4 py-3 mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-body font-medium text-emerald-800 uppercase tracking-wider">Suggested fix</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(issue.aiFixSuggestion!)}
                            className="text-xs font-body text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-sm font-body text-emerald-900 leading-relaxed">
                          {issue.aiFixSuggestion}
                        </p>
                      </div>
                    )}
```

Note: This is a server component. Because `navigator.clipboard` requires client interaction, wrap the Copy button in a small client component or convert the issue detail section to a client component. Alternatively, use the same pattern as `issues-list.tsx` (which is already a client component). The implementer should check how the page is structured and decide the simplest approach — likely extracting a `<CopyButton text={...} />` client component.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/pages/[pageId]/page.tsx"
git commit -m "feat: show AI fix suggestions on page detail view (Fix tier only)"
```

---

### Task 10: Update free scan results to show AI suggestions

**Files:**
- Modify: `src/app/api/scan/free/[token]/route.ts`
- Modify: `src/components/scan/scan-progress.tsx`

- [ ] **Step 1: Pass aiFixSuggestion in free scan API response**

Prerequisite: Task 6 must be complete — it adds `aiFixSuggestion` to the issue objects stored in `resultsJson`.

In `src/app/api/scan/free/[token]/route.ts`, find the TypeScript type or interface for the response issues array and add `aiFixSuggestion`:

```typescript
      aiFixSuggestion?: string | null;
```

No other mapping change needed — the field is stored in the `resultsJson` JSON blob by Task 6 and passed through to the response.

- [ ] **Step 2: Update ScanIssue interface in scan-progress.tsx**

In `src/components/scan/scan-progress.tsx`, add to the `ScanIssue` interface (after line 31):

```typescript
  aiFixSuggestion?: string | null;
```

- [ ] **Step 3: Render AI suggestion in free scan issue cards**

In `src/components/scan/scan-progress.tsx`, find the issue card rendering inside the `<ul className="space-y-4">` block (line 520-558). Each issue card renders `fixInstructions` on line 550:

```tsx
<p className="font-body text-base text-slate-600 leading-relaxed">{issue.fixInstructions}</p>
```

After line 550 (after the `fixInstructions` paragraph) and before the `wcagCriteria` block (line 551), add:

```tsx
{issue.aiFixSuggestion && (
  <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl px-3 py-2.5 mt-3">
    <p className="text-xs font-body font-semibold text-emerald-800 mb-1">Suggested fix</p>
    <p className="text-sm font-body text-emerald-900 leading-relaxed">
      {issue.aiFixSuggestion}
    </p>
  </div>
)}
```

Note: Free scans show AI suggestions ungated (no tier check) — this is a conversion tool.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/scan/free/[token]/route.ts" src/components/scan/scan-progress.tsx
git commit -m "feat: show AI fix suggestions in free scan results (ungated)"
```
