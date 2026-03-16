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
              cmsType: String(representative.scan.site.cmsType),
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
  for (const [fingerprint, cached] of Array.from(cachedSuggestions)) {
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
