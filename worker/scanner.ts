import { createHash } from 'crypto';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { getTranslation, getFixInstruction } from '../src/lib/translations';

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueSeverity = 'critical' | 'major' | 'minor';

export interface ScannedIssue {
  axeRuleId: string;
  severity: IssueSeverity;
  impact: string;
  description: string;
  fixInstructions: string;
  fixInstructionsCms: string | null;
  elementSelector: string;
  elementHtml: string;
  wcagCriteria: string | null;
  fingerprint: string;
}

export interface ScanPageResult {
  url: string;
  title: string;
  issues: ScannedIssue[];
  screenshotBuffer: Buffer | null;
  error?: string;
}

export interface ScanOptions {
  takeScreenshot?: boolean;
  timeout?: number; // ms, default 30000
}

// ─── Severity map ─────────────────────────────────────────────────────────────

export const SEVERITY_MAP: Record<string, IssueSeverity> = {
  critical: 'critical',
  serious: 'major',
  moderate: 'major',
  minor: 'minor',
};

// ─── computeFingerprint ───────────────────────────────────────────────────────

export function computeFingerprint(
  pageUrl: string,
  ruleId: string,
  selector: string
): string {
  const raw = `${pageUrl}|${ruleId}|${selector}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

// ─── createBrowser ────────────────────────────────────────────────────────────

export async function createBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

// ─── scanPage ─────────────────────────────────────────────────────────────────

export async function scanPage(
  browser: Browser,
  url: string,
  cmsType: string,
  options?: ScanOptions
): Promise<ScanPageResult> {
  const timeout = options?.timeout ?? 30_000;
  let context: BrowserContext | null = null;

  try {
    context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    // Use domcontentloaded — networkidle hangs on sites with persistent
    // analytics/tracker connections (very common on school/gov sites).
    // After DOM is ready, give an extra 2s for JS to settle.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(2000);

    const title = await page.title();

    // Run axe-core with WCAG 2.1 AA tags
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Map violations to ScannedIssue
    const issues: ScannedIssue[] = [];

    for (const violation of axeResults.violations) {
      const translation = getTranslation(violation.id);
      const fixInstructionsGeneric =
        translation?.fix.generic ??
        violation.help ??
        'No fix instructions available.';
      const fixInstructionsCms = getFixInstruction(violation.id, cmsType) ?? null;
      const wcagCriteria = translation?.wcag ?? extractWcagCriteria(violation) ?? null;

      for (const node of violation.nodes) {
        const selector = node.target.join(', ');
        const elementHtml = node.html ?? '';
        const impact = node.impact ?? violation.impact ?? 'minor';
        const severity: IssueSeverity = SEVERITY_MAP[impact] ?? 'minor';

        const fingerprint = computeFingerprint(url, violation.id, selector);

        issues.push({
          axeRuleId: violation.id,
          severity,
          impact,
          description: translation?.title ?? violation.help ?? violation.id,
          fixInstructions: fixInstructionsGeneric,
          fixInstructionsCms,
          elementSelector: selector,
          elementHtml,
          wcagCriteria,
          fingerprint,
        });
      }
    }

    // Take screenshot if requested
    let screenshotBuffer: Buffer | null = null;
    if (options?.takeScreenshot !== false) {
      try {
        const screenshotData = await page.screenshot({
          type: 'jpeg',
          quality: 80,
          fullPage: false,
        });
        screenshotBuffer = Buffer.from(screenshotData);
      } catch {
        screenshotBuffer = null;
      }
    }

    await context.close();

    return { url, title, issues, screenshotBuffer };
  } catch (err) {
    if (context) {
      try {
        await context.close();
      } catch {
        // ignore
      }
    }
    const error = err instanceof Error ? err.message : String(err);
    return { url, title: '', issues: [], screenshotBuffer: null, error };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractWcagCriteria(violation: { tags?: string[] }): string | null {
  if (!violation.tags) return null;
  const wcagTags = violation.tags.filter((t) => /^wcag\d/.test(t));
  if (wcagTags.length === 0) return null;
  return wcagTags.join(', ');
}
