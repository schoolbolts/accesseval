import {
  calculatePageScore,
  calculateSiteScore,
  mapScoreToGrade,
  type PageIssues,
  type UniqueIssue,
} from '../src/lib/scoring';

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueSeverity = 'critical' | 'major' | 'minor';

export interface PageResult {
  url: string;
  issues: Array<{ severity: IssueSeverity | string; axeRuleId?: string }>;
}

export interface PageScoreEntry {
  url: string;
  score: number;
}

export interface ScanScoreResult {
  score: number;
  grade: string;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  uniqueIssueCount: number;
  pageScores: PageScoreEntry[];
}

// ─── scoreScanResults ─────────────────────────────────────────────────────────

export function scoreScanResults(pages: PageResult[]): ScanScoreResult {
  let totalCritical = 0;
  let totalMajor = 0;
  let totalMinor = 0;

  // Track unique issue types: ruleId → { severity, pages affected }
  const ruleMap = new Map<string, { severity: IssueSeverity; pages: Set<string> }>();

  const pageScores: PageScoreEntry[] = pages.map((page) => {
    const counts: PageIssues = { critical: 0, major: 0, minor: 0 };
    for (const issue of page.issues) {
      const sev = issue.severity as IssueSeverity;
      if (sev === 'critical') counts.critical++;
      else if (sev === 'major') counts.major++;
      else if (sev === 'minor') counts.minor++;

      const ruleId = issue.axeRuleId ?? `unknown-${sev}`;
      if (!ruleMap.has(ruleId)) {
        ruleMap.set(ruleId, { severity: sev, pages: new Set() });
      }
      const entry = ruleMap.get(ruleId)!;
      entry.pages.add(page.url);
      if (sev === 'critical' && entry.severity !== 'critical') {
        entry.severity = 'critical';
      } else if (sev === 'major' && entry.severity === 'minor') {
        entry.severity = 'major';
      }
    }
    totalCritical += counts.critical;
    totalMajor += counts.major;
    totalMinor += counts.minor;
    return { url: page.url, score: calculatePageScore(counts) };
  });

  const uniqueIssues: UniqueIssue[] = Array.from(ruleMap.values()).map((entry) => ({
    severity: entry.severity,
    pagesAffected: entry.pages.size,
  }));

  // Site score = average of page scores with unique-issue penalty
  const siteScore = calculateSiteScore(
    pageScores.map((p) => p.score),
    uniqueIssues,
  );
  const grade = mapScoreToGrade(siteScore);

  return {
    score: siteScore,
    grade,
    criticalCount: totalCritical,
    majorCount: totalMajor,
    minorCount: totalMinor,
    uniqueIssueCount: uniqueIssues.length,
    pageScores,
  };
}
