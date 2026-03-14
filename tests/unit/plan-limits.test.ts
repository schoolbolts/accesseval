import { describe, it, expect } from 'vitest';
import { canUseFeature, getMaxPages, getOnDemandLimit, getTeamMemberLimit } from '../../src/lib/plan-limits';

describe('canUseFeature', () => {
  it('scan tier cannot use issue tracking', () => {
    expect(canUseFeature('scan', 'issueTracking')).toBe(false);
  });

  it('comply tier can use issue tracking', () => {
    expect(canUseFeature('comply', 'issueTracking')).toBe(true);
  });

  it('scan tier cannot use board reports', () => {
    expect(canUseFeature('scan', 'boardReport')).toBe(false);
  });

  it('comply tier can use board reports', () => {
    expect(canUseFeature('comply', 'boardReport')).toBe(true);
  });

  it('comply tier cannot use CMS fix instructions', () => {
    expect(canUseFeature('comply', 'cmsFixInstructions')).toBe(false);
  });

  it('fix tier can use CMS fix instructions', () => {
    expect(canUseFeature('fix', 'cmsFixInstructions')).toBe(true);
  });
});

describe('getMaxPages', () => {
  it('scan = 100', () => expect(getMaxPages('scan')).toBe(100));
  it('comply = 500', () => expect(getMaxPages('comply')).toBe(500));
  it('fix = 2000', () => expect(getMaxPages('fix')).toBe(2000));
});

describe('getOnDemandLimit', () => {
  it('scan = 2', () => expect(getOnDemandLimit('scan')).toBe(2));
  it('comply = 5', () => expect(getOnDemandLimit('comply')).toBe(5));
  it('fix = Infinity', () => expect(getOnDemandLimit('fix')).toBe(Infinity));
});

describe('getTeamMemberLimit', () => {
  it('scan = 1', () => expect(getTeamMemberLimit('scan')).toBe(1));
  it('comply = 3', () => expect(getTeamMemberLimit('comply')).toBe(3));
  it('fix = 10', () => expect(getTeamMemberLimit('fix')).toBe(10));
});
