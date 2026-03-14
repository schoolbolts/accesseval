import { describe, it, expect } from 'vitest';
import { calculatePageScore, calculateSiteScore, mapScoreToGrade } from '../../src/lib/scoring';

describe('calculatePageScore', () => {
  it('returns 100 for no issues', () => {
    expect(calculatePageScore({ critical: 0, major: 0, minor: 0 })).toBe(100);
  });

  it('deducts 10 per critical', () => {
    expect(calculatePageScore({ critical: 1, major: 0, minor: 0 })).toBe(90);
  });

  it('deducts 3 per major', () => {
    expect(calculatePageScore({ critical: 0, major: 1, minor: 0 })).toBe(97);
  });

  it('deducts 1 per minor', () => {
    expect(calculatePageScore({ critical: 0, major: 0, minor: 1 })).toBe(99);
  });

  it('combines all severities', () => {
    // 2*10 + 3*3 + 5*1 = 20+9+5 = 34 → 100-34 = 66
    expect(calculatePageScore({ critical: 2, major: 3, minor: 5 })).toBe(66);
  });

  it('floors at 0', () => {
    expect(calculatePageScore({ critical: 15, major: 0, minor: 0 })).toBe(0);
  });

  it('caps deductions at 100', () => {
    // 20*10 = 200, capped to 100 → score = 0
    expect(calculatePageScore({ critical: 20, major: 10, minor: 20 })).toBe(0);
  });
});

describe('calculateSiteScore', () => {
  it('returns 0 for empty array', () => {
    expect(calculateSiteScore([])).toBe(0);
  });

  it('returns single page score unchanged', () => {
    expect(calculateSiteScore([85])).toBe(85);
  });

  it('averages two pages', () => {
    expect(calculateSiteScore([100, 80])).toBe(90);
  });

  it('rounds to nearest integer', () => {
    // (100 + 80 + 75) / 3 = 85
    expect(calculateSiteScore([100, 80, 75])).toBe(85);
  });

  it('handles many pages', () => {
    const scores = Array(200).fill(70);
    expect(calculateSiteScore(scores)).toBe(70);
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
