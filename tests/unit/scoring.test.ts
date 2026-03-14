import { describe, it, expect } from 'vitest';
import { calculatePageScore, calculateSiteScore, mapScoreToGrade } from '../../src/lib/scoring';

describe('calculatePageScore', () => {
  it('returns 100 for no issues', () => {
    expect(calculatePageScore({ critical: 0, major: 0, minor: 0 })).toBe(100);
  });

  it('deducts for critical issues', () => {
    const score = calculatePageScore({ critical: 1, major: 0, minor: 0 });
    expect(score).toBeLessThan(80);
    expect(score).toBeGreaterThan(60);
  });

  it('deducts less for major issues', () => {
    const score = calculatePageScore({ critical: 0, major: 1, minor: 0 });
    expect(score).toBeGreaterThan(85);
  });

  it('many issues drive score toward 0', () => {
    const score = calculatePageScore({ critical: 5, major: 20, minor: 10 });
    expect(score).toBeLessThan(20);
  });
});

describe('calculateSiteScore', () => {
  it('returns 0 for no pages', () => {
    expect(calculateSiteScore([], [])).toBe(0);
  });

  it('returns page average when no unique issues', () => {
    expect(calculateSiteScore([90, 80, 100], [])).toBe(90);
  });

  it('applies penalty for unique issue types', () => {
    const withoutIssues = calculateSiteScore([90, 90, 90], []);
    const withIssues = calculateSiteScore([90, 90, 90], [
      { severity: 'major', pagesAffected: 3 },
      { severity: 'major', pagesAffected: 2 },
    ]);
    expect(withIssues).toBeLessThan(withoutIssues);
  });

  it('critical types penalize more than major', () => {
    const withCritical = calculateSiteScore([90], [
      { severity: 'critical', pagesAffected: 1 },
    ]);
    const withMajor = calculateSiteScore([90], [
      { severity: 'major', pagesAffected: 1 },
    ]);
    expect(withCritical).toBeLessThan(withMajor);
  });

  it('site score tracks intuitively with page scores', () => {
    // Pages avg ~90, 10 unique major types → site should be in 70s, not 30s
    const pages = Array(99).fill(90);
    const issues = Array(9).fill({ severity: 'major' as const, pagesAffected: 20 });
    issues.push({ severity: 'critical' as const, pagesAffected: 1 });
    const score = calculateSiteScore(pages, issues);
    expect(score).toBeGreaterThan(65);
    expect(score).toBeLessThan(90);
  });

  it('penalty is capped at 40%', () => {
    const pages = [100];
    const manyIssues = Array(50).fill({ severity: 'critical' as const, pagesAffected: 10 });
    const score = calculateSiteScore(pages, manyIssues);
    // 100 * (1 - 0.4) = 60, not zero
    expect(score).toBe(60);
  });
});

describe('mapScoreToGrade', () => {
  const cases: [number, string][] = [
    [100, 'A'], [95, 'A'], [94, 'A-'], [90, 'A-'],
    [89, 'B+'], [87, 'B+'], [86, 'B'], [83, 'B'],
    [82, 'B-'], [80, 'B-'], [79, 'C+'], [77, 'C+'],
    [76, 'C'], [73, 'C'], [72, 'C-'], [70, 'C-'],
    [69, 'D+'], [65, 'D+'], [64, 'D'], [60, 'D'],
    [59, 'D-'], [55, 'D-'], [54, 'F'], [0, 'F'],
  ];

  cases.forEach(([score, grade]) => {
    it(`maps ${score} → ${grade}`, () => {
      expect(mapScoreToGrade(score)).toBe(grade);
    });
  });
});
