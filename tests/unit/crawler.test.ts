import { describe, it, expect } from 'vitest';
import { parseSitemapXml, extractInternalLinks, deduplicateUrls, normalizeUrl } from '../../worker/crawler';

describe('normalizeUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });
  it('strips fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
  });
  it('strips common tracking params', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=foo')).toBe('https://example.com/page');
  });
  it('preserves meaningful query params', () => {
    expect(normalizeUrl('https://example.com/page?id=123')).toBe('https://example.com/page?id=123');
  });
  it('lowercases hostname', () => {
    expect(normalizeUrl('https://EXAMPLE.COM/Page')).toBe('https://example.com/Page');
  });
});

describe('parseSitemapXml', () => {
  it('extracts URLs from simple sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/page1</loc></url>
        <url><loc>https://example.com/page2</loc></url>
      </urlset>`;
    const urls = parseSitemapXml(xml, 'https://example.com');
    expect(urls).toEqual(['https://example.com/page1', 'https://example.com/page2']);
  });
  it('detects nested sitemap index', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
      </sitemapindex>`;
    const result = parseSitemapXml(xml, 'https://example.com');
    expect(result).toEqual({ sitemapUrls: ['https://example.com/sitemap-pages.xml'] });
  });
  it('filters URLs outside base domain', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/page1</loc></url>
        <url><loc>https://other.com/page2</loc></url>
      </urlset>`;
    const urls = parseSitemapXml(xml, 'https://example.com');
    expect(urls).toEqual(['https://example.com/page1']);
  });
});

describe('extractInternalLinks', () => {
  it('extracts internal links from HTML', () => {
    const html = `<html><body>
      <a href="/about">About</a>
      <a href="https://example.com/contact">Contact</a>
      <a href="https://other.com">External</a>
    </body></html>`;
    const links = extractInternalLinks(html, 'https://example.com');
    expect(links).toContain('https://example.com/about');
    expect(links).toContain('https://example.com/contact');
    expect(links).not.toContain('https://other.com');
  });
  it('collects PDF links separately', () => {
    const html = `<html><body>
      <a href="/doc.pdf">Download</a>
      <a href="/page">Page</a>
    </body></html>`;
    const result = extractInternalLinks(html, 'https://example.com', { collectPdfs: true });
    expect(result.pageUrls).toContain('https://example.com/page');
    expect(result.pdfUrls).toContain('https://example.com/doc.pdf');
  });
});

describe('deduplicateUrls', () => {
  it('removes duplicate URLs', () => {
    const urls = ['https://example.com/page', 'https://example.com/page', 'https://example.com/other'];
    expect(deduplicateUrls(urls)).toEqual(['https://example.com/page', 'https://example.com/other']);
  });
  it('normalizes before deduplicating', () => {
    const urls = ['https://example.com/page/', 'https://example.com/page'];
    expect(deduplicateUrls(urls)).toHaveLength(1);
  });
});
