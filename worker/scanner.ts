import { createHash } from 'crypto';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { getTranslation, getFixInstruction } from '../src/lib/translations';
import { detectCms } from './detect-cms';

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
  elementScreenshotBuffer: Buffer | null;
}

export interface ScanPageResult {
  url: string;
  title: string;
  issues: ScannedIssue[];
  screenshotBuffer: Buffer | null;
  detectedCms: string;
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
      '--disable-blink-features=AutomationControlled',
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

    // Stealth patches — mask automation signals that trigger Cloudflare Turnstile
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      (window as Record<string, unknown>).chrome = { runtime: {}, csi: () => ({}), loadTimes: () => ({}) };
    });

    // Use domcontentloaded — networkidle hangs on sites with persistent
    // analytics/tracker connections (very common on school/gov sites).
    // After DOM is ready, give an extra 2s for JS to settle.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(2000);

    // Handle Cloudflare challenge — detect and attempt to resolve
    const pageTitle = await page.title();
    if (
      pageTitle.includes('Just a moment') ||
      pageTitle.includes('Attention Required') ||
      pageTitle.includes('Checking your browser')
    ) {
      console.log(`[scanner] Cloudflare challenge detected on ${url}, attempting to resolve...`);
      try {
        // Try clicking the Turnstile checkbox if present
        const turnstileFrame = page.frameLocator('iframe[src*="challenges.cloudflare.com"]');
        const checkbox = turnstileFrame.locator('input[type="checkbox"], .cb-i, #challenge-stage');
        if (await checkbox.count().catch(() => 0) > 0) {
          await checkbox.first().click({ timeout: 3000 }).catch(() => {});
        }

        // Wait for the challenge page to resolve and redirect
        await page.waitForFunction(
          () => !document.title.includes('Just a moment') &&
                !document.title.includes('Attention Required') &&
                !document.title.includes('Checking your browser'),
          { timeout: 15_000 }
        );
        await page.waitForTimeout(2000);
      } catch {
        console.warn(`[scanner] Cloudflare challenge did not resolve for ${url}`);
      }
    }

    const title = await page.title();

    // Auto-detect CMS if not specified
    let effectiveCms = cmsType;
    if (cmsType === 'unknown') {
      const html = await page.content();
      effectiveCms = detectCms(html);
    }

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
      const fixInstructionsCms = getFixInstruction(violation.id, effectiveCms) ?? null;
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
          elementScreenshotBuffer: null,
        });
      }
    }

    // Capture element-level screenshots for top issues (most severe first)
    const severityRank: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    const sortedForScreenshots = [...issues].sort(
      (a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3)
    );
    const screenshotTargets = sortedForScreenshots.slice(0, 5);

    for (const issue of screenshotTargets) {
      try {
        const el = page.locator(issue.elementSelector).first();
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          // Scroll into view and capture with padding
          await el.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
          const shotData = await el.screenshot({
            type: 'jpeg',
            quality: 85,
            timeout: 5000,
          });
          issue.elementScreenshotBuffer = Buffer.from(shotData);
        }
      } catch {
        // Element may not be screenshottable — skip silently
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

    return { url, title, issues, screenshotBuffer, detectedCms: effectiveCms };
  } catch (err) {
    if (context) {
      try {
        await context.close();
      } catch {
        // ignore
      }
    }
    const error = err instanceof Error ? err.message : String(err);
    return { url, title: '', issues: [], screenshotBuffer: null, detectedCms: cmsType, error };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractWcagCriteria(violation: { tags?: string[] }): string | null {
  if (!violation.tags) return null;
  const wcagTags = violation.tags.filter((t) => /^wcag\d/.test(t));
  if (wcagTags.length === 0) return null;
  return wcagTags.join(', ');
}
