import {
  calculatePageScore,
  calculateSiteScore,
  mapScoreToGrade,
  type PageIssues,
} from '../src/lib/scoring';

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueSeverity = 'critical' | 'major' | 'minor';

export interface PageResult {
  url: string;
  issues: Array<{ severity: IssueSeverity | string }>;
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
  pageScores: PageScoreEntry[];
}

// ─── scoreScanResults ─────────────────────────────────────────────────────────

export function scoreScanResults(pages: PageResult[]): ScanScoreResult {
  let totalCritical = 0;
  let totalMajor = 0;
  let totalMinor = 0;

  const pageScores: PageScoreEntry[] = pages.map((page) => {
    const counts: PageIssues = { critical: 0, major: 0, minor: 0 };
    for (const issue of page.issues) {
      if (issue.severity === 'critical') counts.critical++;
      else if (issue.severity === 'major') counts.major++;
      else if (issue.severity === 'minor') counts.minor++;
    }
    totalCritical += counts.critical;
    totalMajor += counts.major;
    totalMinor += counts.minor;
    return { url: page.url, score: calculatePageScore(counts) };
  });

  const siteScore = calculateSiteScore(pageScores.map((p) => p.score));
  const grade = mapScoreToGrade(siteScore);

  return {
    score: siteScore,
    grade,
    criticalCount: totalCritical,
    majorCount: totalMajor,
    minorCount: totalMinor,
    pageScores,
  };
}
