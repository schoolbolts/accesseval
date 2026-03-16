import { prisma } from '../../src/lib/db';
import { crawlSite } from '../crawler';
import { createBrowser, scanPage } from '../scanner';
import type { ScannedIssue } from '../scanner';
import { scoreScanResults } from '../scorer';
import { computeIssueDiff } from '../differ';
import { notifyScanComplete } from '../notifier';
import { generateScanSummary } from '../../src/lib/ai-summary';
import { uploadScreenshot } from '../../src/lib/r2';
import { aiEnrichmentQueue } from '../../src/lib/queue';
import { canUseFeature } from '../../src/lib/plan-limits';
import type { PlanName } from '../../src/lib/plan-limits';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanJobData {
  scanId: string;
  siteId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const PAGE_RETRY_DELAY_MS = 2_000;
const RATE_LIMIT_DELAY_MS = 1_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDeadlineExceeded(startedAt: number): boolean {
  return Date.now() - startedAt > JOB_TIMEOUT_MS;
}

// ─── processFullScan ──────────────────────────────────────────────────────────

export async function processFullScan(data: ScanJobData): Promise<void> {
  const { scanId, siteId } = data;
  const startedAt = Date.now();

  // Mark scan as started
  await prisma.scan.update({
    where: { id: scanId },
    data: { status: 'crawling', startedAt: new Date() },
  });

  // Fetch site config
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { organization: true },
  });

  if (!site) {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        errorMessage: `Site ${siteId} not found`,
        completedAt: new Date(),
      },
    });
    return;
  }

  const cmsType = site.cmsType ?? 'unknown';

  // ─── Phase 1: Crawl ───────────────────────────────────────────────────────

  let crawlResult: { pageUrls: string[]; pdfUrls: string[] };
  try {
    crawlResult = await crawlSite(site.url, site.maxPages, (scanned, total) => {
      console.log(`[full-scan] ${scanId} crawl progress: ${scanned}/${total}`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        errorMessage: `Crawl failed: ${message}`,
        completedAt: new Date(),
      },
    });
    return;
  }

  if (crawlResult.pageUrls.length === 0) {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        errorMessage: 'Crawl returned no URLs',
        completedAt: new Date(),
      },
    });
    return;
  }

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: 'scanning',
      pagesFound: crawlResult.pageUrls.length,
    },
  });

  // ─── Phase 2: Scan pages ──────────────────────────────────────────────────

  const browser = await createBrowser();
  const pageIdMap = new Map<string, string>(); // url → page db id

  type PageScanData = {
    url: string;
    issues: Array<{ severity: string }>;
    pageDbId: string | null;
  };

  const scannedPages: PageScanData[] = [];
  let pagesScanned = 0;
  let pagesFailed = 0;

  for (const pageUrl of crawlResult.pageUrls) {
    if (isDeadlineExceeded(startedAt)) {
      console.warn(`[full-scan] ${scanId} deadline exceeded — stopping early`);
      break;
    }

    // Attempt scan with one retry
    let scanResult = await scanPage(browser, pageUrl, cmsType, { takeScreenshot: true });

    if (scanResult.error) {
      await sleep(PAGE_RETRY_DELAY_MS);
      scanResult = await scanPage(browser, pageUrl, cmsType, { takeScreenshot: true });
    }

    if (scanResult.error) {
      // Record error page
      const page = await prisma.page.create({
        data: {
          scanId,
          url: pageUrl,
          title: null,
          status: 'error',
          issueCount: 0,
        },
      });
      pageIdMap.set(pageUrl, page.id);
      pagesFailed++;

      scannedPages.push({ url: pageUrl, issues: [], pageDbId: page.id });
    } else {
      // Count issues
      const issuesBySeverity = { critical: 0, major: 0, minor: 0 };
      for (const issue of scanResult.issues) {
        if (issue.severity === 'critical') issuesBySeverity.critical++;
        else if (issue.severity === 'major') issuesBySeverity.major++;
        else if (issue.severity === 'minor') issuesBySeverity.minor++;
      }

      const { calculatePageScore } = await import('../../src/lib/scoring');
      const pageScore = calculatePageScore(issuesBySeverity);

      const page = await prisma.page.create({
        data: {
          scanId,
          url: pageUrl,
          title: scanResult.title || null,
          status: 'scanned',
          issueCount: scanResult.issues.length,
          pageScore,
        },
      });
      pageIdMap.set(pageUrl, page.id);

      // Upload full-page screenshot to R2
      if (scanResult.screenshotBuffer) {
        try {
          const key = `scans/${scanId}/${page.id}/page.jpg`;
          const pageScreenshotUrl = await uploadScreenshot(key, scanResult.screenshotBuffer, 'image/jpeg');
          await prisma.page.update({
            where: { id: page.id },
            data: { screenshotPath: pageScreenshotUrl },
          });
        } catch {
          // Page screenshot upload failed — continue without it
        }
      }

      // Upload element screenshots to R2 and persist issues
      if (scanResult.issues.length > 0) {
        const screenshotUrls = new Map<number, string>();
        for (let i = 0; i < scanResult.issues.length; i++) {
          const issue = scanResult.issues[i];
          if (issue.elementScreenshotBuffer) {
            try {
              const key = `scans/${scanId}/${page.id}/issue-${i}.jpg`;
              const url = await uploadScreenshot(key, issue.elementScreenshotBuffer, 'image/jpeg');
              screenshotUrls.set(i, url);
            } catch {
              // Screenshot upload failed — continue without it
            }
          }
        }

        await prisma.issue.createMany({
          data: scanResult.issues.map((issue, i) => ({
            scanId,
            pageId: page.id,
            axeRuleId: issue.axeRuleId,
            severity: issue.severity,
            impact: issue.impact,
            description: issue.description,
            fixInstructions: issue.fixInstructions,
            fixInstructionsCms: issue.fixInstructionsCms,
            elementSelector: issue.elementSelector,
            elementHtml: issue.elementHtml,
            wcagCriteria: issue.wcagCriteria,
            fingerprint: issue.fingerprint,
            screenshotPath: screenshotUrls.get(i) ?? null,
          })),
        });
      }

      scannedPages.push({ url: pageUrl, issues: scanResult.issues, pageDbId: page.id });
      pagesScanned++;

      // Update progress
      await prisma.scan.update({
        where: { id: scanId },
        data: { pagesScanned: pagesScanned },
      });
    }

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  await browser.close();

  // ─── Check if all pages failed ────────────────────────────────────────────

  if (pagesScanned === 0 && pagesFailed > 0) {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        errorMessage: 'All pages failed to scan',
        completedAt: new Date(),
      },
    });
    return;
  }

  // ─── Phase 3: Score ───────────────────────────────────────────────────────

  const scoreInput = scannedPages
    .filter((p) => p.pageDbId !== null && p.issues !== null)
    .map((p) => ({
      url: p.url,
      issues: p.issues.map((i) => ({ severity: i.severity as 'critical' | 'major' | 'minor' })),
    }));

  const scoreResult = scoreScanResults(scoreInput);

  // ─── Phase 4: Diff against previous scan ─────────────────────────────────

  const previousScan = await prisma.scan.findFirst({
    where: {
      siteId,
      status: { in: ['completed', 'partial'] },
      id: { not: scanId },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      issues: { select: { fingerprint: true } },
    },
  });

  const currentFingerprints = scannedPages.flatMap((p) =>
    p.issues.map((i) => (i as { fingerprint?: string }).fingerprint ?? '')
  ).filter(Boolean);

  const previousFingerprints = previousScan
    ? previousScan.issues.map((i) => i.fingerprint)
    : [];

  // Get ignored fingerprints for this site
  const ignoredSiteIssues = await prisma.siteIssue.findMany({
    where: { siteId, status: 'ignored' },
    select: { fingerprint: true },
  });
  const ignoredFingerprints = ignoredSiteIssues.map((si) => si.fingerprint);

  const diff = computeIssueDiff({
    currentFingerprints,
    previousFingerprints,
    ignoredFingerprints,
  });

  // Update SiteIssue records
  const now = new Date();

  // New issues
  for (const fp of diff.newFingerprints) {
    await prisma.siteIssue.upsert({
      where: { siteId_fingerprint: { siteId, fingerprint: fp } },
      create: {
        siteId,
        fingerprint: fp,
        firstSeenScanId: scanId,
        lastSeenScanId: scanId,
        status: 'open',
        statusChangedAt: now,
      },
      update: {
        lastSeenScanId: scanId,
        status: 'open',
      },
    });
  }

  // Persisting issues
  for (const fp of diff.persistingFingerprints) {
    await prisma.siteIssue.updateMany({
      where: { siteId, fingerprint: fp },
      data: { lastSeenScanId: scanId },
    });
  }

  // Fixed issues
  for (const fp of diff.fixedFingerprints) {
    await prisma.siteIssue.updateMany({
      where: { siteId, fingerprint: fp, status: 'open' },
      data: {
        status: 'fixed',
        resolvedScanId: scanId,
        statusChangedAt: now,
      },
    });
  }

  // ─── Phase 5: Finalize scan ───────────────────────────────────────────────

  const finalStatus =
    pagesFailed > 0 && pagesScanned > 0 ? 'partial' : 'completed';

  const completedScan = await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: finalStatus,
      score: scoreResult.score,
      grade: scoreResult.grade,
      criticalCount: scoreResult.criticalCount,
      majorCount: scoreResult.majorCount,
      minorCount: scoreResult.minorCount,
      pagesScanned,
      completedAt: new Date(),
    },
    include: {
      site: {
        include: { organization: true },
      },
    },
  });

  // ─── Phase 5b: AI summary ────────────────────────────────────────────────

  try {
    // Build grouped issues for the prompt
    const issueGroups = new Map<string, { severity: string; description: string; count: number; pages: Set<string> }>();
    for (const page of scannedPages) {
      for (const issue of page.issues) {
        const iss = issue as { axeRuleId?: string; severity: string; description?: string };
        const ruleId = iss.axeRuleId ?? 'unknown';
        if (!issueGroups.has(ruleId)) {
          issueGroups.set(ruleId, {
            severity: iss.severity,
            description: iss.description ?? ruleId,
            count: 0,
            pages: new Set(),
          });
        }
        const g = issueGroups.get(ruleId)!;
        g.count++;
        g.pages.add(page.url);
      }
    }

    const uniqueIssues = Array.from(issueGroups.entries()).map(([ruleId, g]) => ({
      axeRuleId: ruleId,
      severity: g.severity,
      description: g.description,
      count: g.count,
      pagesAffected: g.pages.size,
    }));

    const summary = await generateScanSummary({
      siteUrl: site.url,
      score: scoreResult.score,
      grade: scoreResult.grade,
      pagesScanned,
      uniqueIssues,
    });

    if (summary) {
      await prisma.scan.update({
        where: { id: scanId },
        data: { summary },
      });
      console.log(`[full-scan] ${scanId} AI summary generated (${summary.length} chars)`);
    }
  } catch (err) {
    console.warn(`[full-scan] ${scanId} AI summary failed:`, err);
  }

  // ─── Phase 5c: Queue AI fix suggestion enrichment (Fix tier only) ────────

  if (canUseFeature(completedScan.site.organization.plan as PlanName, 'aiFixSuggestions')) {
    console.log(`[full-scan] ${scanId} queuing AI fix enrichment`);
    await aiEnrichmentQueue.add('ai-enrichment', { scanId }, {
      jobId: `ai-enrichment-${scanId}`,
    });
  }

  // ─── Phase 6: (screenshots now stored in R2, no local cleanup needed) ────

  // ─── Phase 7: Notify ──────────────────────────────────────────────────────

  await notifyScanComplete(completedScan);

  console.log(
    `[full-scan] ${scanId} complete: status=${finalStatus} score=${scoreResult.score} grade=${scoreResult.grade} pages=${pagesScanned}/${crawlResult.pageUrls.length}`
  );
}
