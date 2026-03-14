export interface PageIssues {
  critical: number;
  major: number;
  minor: number;
}

const WEIGHTS = { critical: 10, major: 3, minor: 1 } as const;

export function calculatePageScore(issues: PageIssues): number {
  const deductions =
    issues.critical * WEIGHTS.critical +
    issues.major * WEIGHTS.major +
    issues.minor * WEIGHTS.minor;
  return Math.max(0, 100 - Math.min(deductions, 100));
}

export function calculateSiteScore(pageScores: number[]): number {
  if (pageScores.length === 0) return 0;
  const sum = pageScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / pageScores.length);
}

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
