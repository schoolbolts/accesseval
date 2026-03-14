export interface PageIssues {
  critical: number;
  major: number;
  minor: number;
}

// ─── Site-level scoring ─────────────────────────────────────────────────────
//
// Site score = average of page scores × (1 - unique issue penalty)
//
// This ensures the site score tracks intuitively with what users see on the
// Pages view. The penalty reflects that having many *different types* of
// issues means more distinct problems to fix.
//
// Penalty per unique issue type:
//   critical → 4% per type
//   major    → 1.5% per type
//   minor    → 0.5% per type
// Penalty is capped at 40% so even terrible sites don't drop to zero
// if their pages individually score okay.

export interface UniqueIssue {
  severity: 'critical' | 'major' | 'minor';
  pagesAffected: number;
}

const PENALTY_PER_TYPE = { critical: 0.04, major: 0.015, minor: 0.005 } as const;
const MAX_PENALTY = 0.40;

export function calculateSiteScore(
  pageScores: number[],
  uniqueIssues: UniqueIssue[],
): number {
  if (pageScores.length === 0) return 0;

  const avg = pageScores.reduce((a, b) => a + b, 0) / pageScores.length;

  if (uniqueIssues.length === 0) return Math.round(avg);

  let penalty = 0;
  for (const issue of uniqueIssues) {
    penalty += PENALTY_PER_TYPE[issue.severity] ?? 0.005;
  }
  penalty = Math.min(penalty, MAX_PENALTY);

  return Math.max(0, Math.round(avg * (1 - penalty)));
}

// ─── Per-page scoring ───────────────────────────────────────────────────────

const SEVERITY_WEIGHTS = { critical: 10, major: 3, minor: 0.5 } as const;
const PAGE_K = 0.03;

export function calculatePageScore(issues: PageIssues): number {
  const weighted =
    issues.critical * SEVERITY_WEIGHTS.critical +
    issues.major * SEVERITY_WEIGHTS.major +
    issues.minor * SEVERITY_WEIGHTS.minor;
  if (weighted === 0) return 100;
  return Math.max(0, Math.round(100 * Math.exp(-PAGE_K * weighted)));
}

// ─── Grade mapping ──────────────────────────────────────────────────────────

const GRADE_THRESHOLDS: [number, string][] = [
  [95, 'A'], [90, 'A-'], [87, 'B+'], [83, 'B'], [80, 'B-'],
  [77, 'C+'], [73, 'C'], [70, 'C-'], [65, 'D+'], [60, 'D'],
  [55, 'D-'],
];

export function mapScoreToGrade(score: number): string {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) return grade;
  }
  return 'F';
}
