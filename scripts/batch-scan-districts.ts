/**
 * Batch scanner — scans district home pages for accessibility issues.
 *
 * Usage:
 *   npx tsx scripts/batch-scan-districts.ts              # scan all unscanned
 *   npx tsx scripts/batch-scan-districts.ts --limit 100  # scan up to 100
 *   npx tsx scripts/batch-scan-districts.ts --state MA   # only Massachusetts
 *   npx tsx scripts/batch-scan-districts.ts --rescan      # re-scan already scanned
 */

import 'dotenv/config';

// Use PROD_DATABASE_URL for batch jobs if available (connect to prod from local)
if (process.env.PROD_DATABASE_URL && !process.env.BATCH_USE_LOCAL) {
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
  console.log('Using PROD_DATABASE_URL');
}

import { prisma } from '../src/lib/db';
import { createBrowser, scanPage } from '../worker/scanner';
import { scoreScanResults } from '../worker/scorer';
import { uploadScreenshot } from '../src/lib/r2';
import sharp from 'sharp';
import type { Browser } from 'playwright';

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit') || '0', 10) || 0;
const STATE_FILTER = getArg('state')?.toUpperCase();
const RESCAN = hasFlag('rescan');
const BATCH_SIZE = 10; // districts per browser instance before recycling
const DELAY_MS = 1500; // delay between scans (be polite)

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== AccessEval Batch District Scanner ===');
  console.log(`  Limit: ${LIMIT || 'unlimited'}`);
  console.log(`  State: ${STATE_FILTER || 'all'}`);
  console.log(`  Rescan: ${RESCAN}`);
  console.log();

  // Build query for districts to scan
  const where: Record<string, unknown> = {
    website: { not: null },
  };
  if (!RESCAN) {
    where.lastScannedAt = null;
  }
  if (STATE_FILTER) {
    where.stateCode = STATE_FILTER;
  }

  const districts = await prisma.district.findMany({
    where,
    orderBy: { name: 'asc' },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
    select: {
      id: true,
      name: true,
      website: true,
      stateCode: true,
      ncesId: true,
    },
  });

  console.log(`Found ${districts.length} districts to scan.\n`);
  if (districts.length === 0) return;

  let browser: Browser = await createBrowser();
  let scannedInBatch = 0;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < districts.length; i++) {
    const district = districts[i];
    const url = district.website!;
    const progress = `[${i + 1}/${districts.length}]`;

    try {
      // Recycle browser every BATCH_SIZE scans to prevent memory leaks
      if (scannedInBatch >= BATCH_SIZE) {
        await browser.close();
        browser = await createBrowser();
        scannedInBatch = 0;
      }

      console.log(`${progress} Scanning ${district.name} (${district.stateCode}) — ${url}`);

      const result = await scanPage(browser, url, 'unknown', {
        takeScreenshot: true,
        timeout: 45_000,
      });

      if (result.error) {
        console.log(`  ✗ Error: ${result.error}`);
        errorCount++;
        // Still update with error state so we don't retry forever
        await prisma.district.update({
          where: { id: district.id },
          data: {
            lastScannedAt: new Date(),
            score: null,
            grade: null,
            scanResultsJson: { error: result.error, issues: [] },
          },
        });
        scannedInBatch++;
        continue;
      }

      // Score the page
      const scoreResult = scoreScanResults([
        {
          url,
          issues: result.issues.map((iss) => ({
            severity: iss.severity,
            axeRuleId: iss.axeRuleId,
          })),
        },
      ]);

      // Upload screenshot to R2 (convert to WebP)
      let screenshotUrl: string | null = null;
      if (result.screenshotBuffer) {
        try {
          const webpBuffer = await sharp(result.screenshotBuffer)
            .resize(1280, 800, { fit: 'cover' })
            .webp({ quality: 75 })
            .toBuffer();

          const key = `districts/${district.ncesId}.webp`;
          screenshotUrl = await uploadScreenshot(key, webpBuffer);
          console.log(`  📸 Screenshot uploaded → ${key}`);
        } catch (err) {
          console.log(`  ⚠ Screenshot upload failed: ${err instanceof Error ? err.message : err}`);
        }
      }

      // Build compact issues for storage (top 10, most severe first)
      const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
      const sortedIssues = [...result.issues].sort(
        (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
      );
      const topIssues = sortedIssues.slice(0, 10).map((iss) => ({
        axeRuleId: iss.axeRuleId,
        severity: iss.severity,
        description: iss.description,
        fixInstructions: iss.fixInstructions,
        wcagCriteria: iss.wcagCriteria,
      }));

      // Update district record
      await prisma.district.update({
        where: { id: district.id },
        data: {
          score: scoreResult.score,
          grade: scoreResult.grade,
          criticalCount: scoreResult.criticalCount,
          majorCount: scoreResult.majorCount,
          minorCount: scoreResult.minorCount,
          lastScannedAt: new Date(),
          scanResultsJson: {
            title: result.title,
            totalIssues: result.issues.length,
            issues: topIssues,
          },
          ...(screenshotUrl ? { screenshotUrl } : {}),
        },
      });

      console.log(
        `  ✓ Score: ${scoreResult.score}/100 (${scoreResult.grade}) — ` +
        `${scoreResult.criticalCount}C ${scoreResult.majorCount}M ${scoreResult.minorCount}m — ` +
        `${result.issues.length} total issues`
      );
      successCount++;
    } catch (err) {
      console.log(`  ✗ Unexpected error: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }

    scannedInBatch++;

    // Rate limit
    if (i < districts.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await browser.close();

  console.log(`\n=== Done ===`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log(`  Total:   ${districts.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
