import { describe, it, expect } from 'vitest';
import { computeIssueDiff, type DiffInput, type DiffResult } from '../../worker/differ';

describe('computeIssueDiff', () => {
  it('marks all issues as new when no previous issues exist', () => {
    const result = computeIssueDiff({
      currentFingerprints: ['fp1', 'fp2'],
      previousFingerprints: [],
      ignoredFingerprints: [],
    });
    expect(result.newFingerprints).toEqual(['fp1', 'fp2']);
    expect(result.fixedFingerprints).toEqual([]);
    expect(result.persistingFingerprints).toEqual([]);
  });
  it('marks missing fingerprints as fixed', () => {
    const result = computeIssueDiff({
      currentFingerprints: ['fp1'],
      previousFingerprints: ['fp1', 'fp2', 'fp3'],
      ignoredFingerprints: [],
    });
    expect(result.fixedFingerprints).toEqual(['fp2', 'fp3']);
    expect(result.persistingFingerprints).toEqual(['fp1']);
    expect(result.newFingerprints).toEqual([]);
  });
  it('does not mark ignored issues as fixed', () => {
    const result = computeIssueDiff({
      currentFingerprints: [],
      previousFingerprints: ['fp1', 'fp2'],
      ignoredFingerprints: ['fp2'],
    });
    expect(result.fixedFingerprints).toEqual(['fp1']);
  });
  it('identifies persisting issues', () => {
    const result = computeIssueDiff({
      currentFingerprints: ['fp1', 'fp2', 'fp3'],
      previousFingerprints: ['fp1', 'fp2'],
      ignoredFingerprints: [],
    });
    expect(result.persistingFingerprints).toEqual(['fp1', 'fp2']);
    expect(result.newFingerprints).toEqual(['fp3']);
  });
});
