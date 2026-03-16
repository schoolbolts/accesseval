import { describe, it, expect } from 'vitest';
import {
  getModelRoute,
  computeCompliantColor,
  buildImageAltPrompt,
  buildTextFixPrompt,
  parseContrastColors,
  extractImageUrl,
} from '../../src/lib/ai-fix';

describe('getModelRoute', () => {
  it('routes image-alt to vision', () => {
    expect(getModelRoute('image-alt')).toBe('vision');
  });

  it('routes image-redundant-alt to vision', () => {
    expect(getModelRoute('image-redundant-alt')).toBe('vision');
  });

  it('routes color-contrast to deterministic', () => {
    expect(getModelRoute('color-contrast')).toBe('deterministic');
  });

  it('routes link-name to text', () => {
    expect(getModelRoute('link-name')).toBe('text');
  });

  it('routes button-name to text', () => {
    expect(getModelRoute('button-name')).toBe('text');
  });

  it('routes heading-order to text', () => {
    expect(getModelRoute('heading-order')).toBe('text');
  });

  it('routes aria rules to text', () => {
    expect(getModelRoute('aria-required-attr')).toBe('text');
  });

  it('routes unknown rules to text', () => {
    expect(getModelRoute('some-unknown-rule')).toBe('text');
  });
});

describe('computeCompliantColor', () => {
  it('returns a darker foreground when contrast is too low', () => {
    const result = computeCompliantColor('#999999', '#ffffff', 4.5);
    expect(result).toBeDefined();
    expect(result!.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result!.newColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('returns null if foreground already meets ratio', () => {
    const result = computeCompliantColor('#000000', '#ffffff', 4.5);
    expect(result).toBeNull();
  });

  it('handles large text ratio (3:1)', () => {
    const result = computeCompliantColor('#aaaaaa', '#ffffff', 3.0);
    expect(result).toBeDefined();
    expect(result!.ratio).toBeGreaterThanOrEqual(3.0);
  });
});

describe('buildImageAltPrompt', () => {
  it('includes page URL context', () => {
    const prompt = buildImageAltPrompt('https://example.com/about');
    expect(prompt).toContain('https://example.com/about');
  });
});

describe('buildTextFixPrompt', () => {
  it('includes element HTML and description', () => {
    const prompt = buildTextFixPrompt({
      description: 'Link text is empty',
      wcagCriteria: '2.4.4',
      elementHtml: '<a href="/about"></a>',
      pageUrl: 'https://example.com',
      cmsType: 'wordpress',
    });
    expect(prompt).toContain('<a href="/about"></a>');
    expect(prompt).toContain('Link text is empty');
    expect(prompt).toContain('wordpress');
  });

  it('truncates elementHtml to 500 chars', () => {
    const longHtml = 'x'.repeat(700);
    const prompt = buildTextFixPrompt({
      description: 'Test',
      wcagCriteria: null,
      elementHtml: longHtml,
      pageUrl: 'https://example.com',
      cmsType: 'unknown',
    });
    expect(prompt).toContain('x'.repeat(500));
    expect(prompt).not.toContain('x'.repeat(501));
  });
});

describe('parseContrastColors', () => {
  it('extracts foreground and background hex colors from description', () => {
    const result = parseContrastColors(
      'Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font-size: 16px)'
    );
    expect(result).toEqual({ fg: '#94a3b8', bg: '#ffffff', isLargeText: false });
  });

  it('detects large text', () => {
    const result = parseContrastColors(
      'Element has insufficient color contrast of 2.56 (foreground color: #94a3b8, background color: #ffffff, font-size: 18px, large text)'
    );
    expect(result).toBeDefined();
    expect(result!.isLargeText).toBe(true);
  });

  it('returns null when colors cannot be parsed', () => {
    const result = parseContrastColors('No color information here');
    expect(result).toBeNull();
  });
});

describe('extractImageUrl', () => {
  it('extracts absolute image src', () => {
    const url = extractImageUrl('<img src="https://cdn.example.com/photo.jpg" />', 'https://example.com');
    expect(url).toBe('https://cdn.example.com/photo.jpg');
  });

  it('resolves relative image src', () => {
    const url = extractImageUrl('<img src="/images/photo.jpg" />', 'https://example.com/about');
    expect(url).toBe('https://example.com/images/photo.jpg');
  });

  it('returns null when no src attribute', () => {
    const url = extractImageUrl('<img alt="test" />', 'https://example.com');
    expect(url).toBeNull();
  });
});
