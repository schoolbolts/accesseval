import { describe, it, expect } from 'vitest';
import { scoreScanResults } from '../../worker/scorer';

describe('scoreScanResults', () => {
  it('scores a clean scan as 100 / A', () => {
    const result = scoreScanResults([
      { issues: [], url: 'https://example.com' },
      { issues: [], url: 'https://example.com/about' },
    ]);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.pageScores).toEqual([
      { url: 'https://example.com', score: 100 },
      { url: 'https://example.com/about', score: 100 },
    ]);
  });
  it('scores pages with issues', () => {
    const result = scoreScanResults([{
      url: 'https://example.com',
      issues: [{ severity: 'critical' }, { severity: 'major' }, { severity: 'minor' }],
    }]);
    expect(result.score).toBe(86);
    expect(result.grade).toBe('B');
    expect(result.criticalCount).toBe(1);
    expect(result.majorCount).toBe(1);
    expect(result.minorCount).toBe(1);
  });
  it('averages across pages', () => {
    const result = scoreScanResults([
      { url: 'https://example.com', issues: [] },
      { url: 'https://example.com/bad', issues: [{ severity: 'critical' }, { severity: 'critical' }] },
    ]);
    expect(result.score).toBe(90);
    expect(result.grade).toBe('A-');
  });
});
