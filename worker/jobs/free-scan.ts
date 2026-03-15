import { prisma } from '../../src/lib/db';
import { createBrowser, scanPage } from '../scanner';
import { scoreScanResults } from '../scorer';
import { uploadScreenshot } from '../../src/lib/r2';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FreeScanJobData {
  freeScanId: string;
  url: string;
}

const MAX_ISSUES_IN_RESULTS = 5;

// ─── processFreeScan ──────────────────────────────────────────────────────────

export async function processFreeScan(data: FreeScanJobData): Promise<void> {
  const { freeScanId, url } = data;

  let browser = await createBrowser();
  let scanResult;

  try {
    scanResult = await scanPage(browser, url, 'unknown', { takeScreenshot: true, timeout: 60_000 });
  } finally {
    await browser.close();
  }

  if (scanResult.error) {
    // Store minimal failed result
    await prisma.freeScan.update({
      where: { id: freeScanId },
      data: {
        score: 0,
        grade: 'F',
        criticalCount: 0,
        majorCount: 0,
        minorCount: 0,
        resultsJson: { error: scanResult.error, issues: [] },
      },
    });
    return;
  }

  // Score the single page
  const scoreResult = scoreScanResults([
    {
      url,
      issues: scanResult.issues.map((i) => ({ severity: i.severity, axeRuleId: i.axeRuleId })),
    },
  ]);

  // Build top 5 issues for resultsJson (most severe first)
  const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  const sortedIssues = [...scanResult.issues].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );
  const topIssues = sortedIssues.slice(0, MAX_ISSUES_IN_RESULTS).map((issue) => ({
    axeRuleId: issue.axeRuleId,
    severity: issue.severity,
    description: issue.description,
    fixInstructions: issue.fixInstructions,
    elementSelector: issue.elementSelector,
    wcagCriteria: issue.wcagCriteria,
  }));

  // Upload screenshot to R2 if available
  let screenshotUrl: string | null = null;
  if (scanResult.screenshotBuffer) {
    try {
      screenshotUrl = await uploadScreenshot(
        `free-scans/${freeScanId}.webp`,
        scanResult.screenshotBuffer,
      );
    } catch (err) {
      console.warn(`[free-scan] ${freeScanId} screenshot upload failed:`, err);
    }
  }

  await prisma.freeScan.update({
    where: { id: freeScanId },
    data: {
      score: scoreResult.score,
      grade: scoreResult.grade,
      criticalCount: scoreResult.criticalCount,
      majorCount: scoreResult.majorCount,
      minorCount: scoreResult.minorCount,
      resultsJson: {
        title: scanResult.title,
        totalIssues: scanResult.issues.length,
        issues: topIssues,
        screenshotUrl,
      },
    },
  });

  console.log(
    `[free-scan] ${freeScanId} complete: score=${scoreResult.score} grade=${scoreResult.grade} issues=${scanResult.issues.length}`
  );
}
