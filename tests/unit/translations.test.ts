import { describe, it, expect } from 'vitest';
import { getTranslation, getFixInstruction } from '../../src/lib/translations';

describe('getTranslation', () => {
  it('returns translation for known rule', () => {
    const t = getTranslation('image-alt');
    expect(t).toBeDefined();
    expect(t!.title).toBe('Image missing description');
    expect(t!.severity).toBe('critical');
    expect(t!.wcag).toBe('1.1.1');
  });

  it('returns undefined for unknown rule', () => {
    expect(getTranslation('nonexistent-rule')).toBeUndefined();
  });
});

describe('getFixInstruction', () => {
  it('returns generic fix for unknown CMS', () => {
    const fix = getFixInstruction('image-alt', 'unknown');
    expect(fix).toContain('Add a description');
  });

  it('returns CMS-specific fix when available', () => {
    const fix = getFixInstruction('image-alt', 'wordpress');
    expect(fix).toContain('WordPress');
  });

  it('falls back to generic when CMS fix not available', () => {
    const fix = getFixInstruction('link-name', 'wordpress');
    expect(fix).toContain('descriptive text');
  });

  it('returns generic fix for unknown rule', () => {
    const fix = getFixInstruction('nonexistent-rule', 'wordpress');
    expect(fix).toBeUndefined();
  });
});
