import * as cheerio from 'cheerio';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SitemapIndex {
  sitemapUrls: string[];
}

export type SitemapResult = string[] | SitemapIndex;

export interface ExtractLinksOptions {
  collectPdfs?: boolean;
}

export interface ExtractLinksResultWithPdfs {
  pageUrls: string[];
  pdfUrls: string[];
}

export type ExtractLinksResult = ExtractLinksResultWithPdfs | string[];

export interface CrawlResult {
  urls: string[];
  pdfUrls: string[];
}

// ─── Tracking params to strip ─────────────────────────────────────────────────

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
]);

// ─── normalizeUrl ─────────────────────────────────────────────────────────────

export function normalizeUrl(urlStr: string): string {
  const url = new URL(urlStr);

  // Lowercase hostname
  url.hostname = url.hostname.toLowerCase();

  // Strip fragment
  url.hash = '';

  // Strip tracking params
  const toDelete: string[] = [];
  for (const key of url.searchParams.keys()) {
    if (TRACKING_PARAMS.has(key) || key.startsWith('utm_')) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) {
    url.searchParams.delete(key);
  }

  // Sort remaining params for canonical form
  url.searchParams.sort();

  let result = url.toString();

  // Strip trailing slash (but not the bare origin slash)
  if (result.endsWith('/') && url.pathname !== '/') {
    result = result.slice(0, -1);
  } else if (result.endsWith('/') && url.pathname === '/' && url.search === '') {
    // Strip trailing slash from bare origin: https://example.com/ → https://example.com
    result = result.slice(0, -1);
  }

  return result;
}

// ─── parseSitemapXml ──────────────────────────────────────────────────────────

export function parseSitemapXml(xml: string, baseUrl: string): SitemapResult {
  const baseDomain = new URL(baseUrl).hostname.toLowerCase();

  // Detect sitemapindex
  if (/<sitemapindex[\s>]/i.test(xml)) {
    const sitemapUrls: string[] = [];
    const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let match: RegExpExecArray | null;
    while ((match = locRegex.exec(xml)) !== null) {
      const loc = match[1].trim();
      sitemapUrls.push(loc);
    }
    return { sitemapUrls };
  }

  // Parse urlset
  const urls: string[] = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    try {
      const parsed = new URL(loc);
      if (parsed.hostname.toLowerCase() === baseDomain) {
        urls.push(loc);
      }
    } catch {
      // skip malformed URLs
    }
  }
  return urls;
}

// ─── extractInternalLinks ─────────────────────────────────────────────────────

export function extractInternalLinks(
  html: string,
  baseUrl: string,
  options?: ExtractLinksOptions
): ExtractLinksResult {
  const baseDomain = new URL(baseUrl).hostname.toLowerCase();
  const $ = cheerio.load(html);

  const pageUrls: string[] = [];
  const pdfUrls: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip non-http anchors
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      return;
    }

    let resolved: URL;
    try {
      resolved = new URL(href, baseUrl);
    } catch {
      return;
    }

    // Only internal
    if (resolved.hostname.toLowerCase() !== baseDomain) return;

    // Only http(s)
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;

    const fullUrl = resolved.toString();

    if (options?.collectPdfs && fullUrl.toLowerCase().endsWith('.pdf')) {
      pdfUrls.push(fullUrl);
    } else {
      pageUrls.push(fullUrl);
    }
  });

  if (options?.collectPdfs) {
    return { pageUrls, pdfUrls };
  }
  return pageUrls;
}

// ─── deduplicateUrls ──────────────────────────────────────────────────────────

export function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    let normalized: string;
    try {
      normalized = normalizeUrl(url);
    } catch {
      normalized = url;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(url);
    }
  }
  return result;
}

// ─── crawlSite ────────────────────────────────────────────────────────────────

export async function crawlSite(
  siteUrl: string,
  maxPages: number,
  onProgress?: (scanned: number, total: number) => void
): Promise<CrawlResult> {
  const baseUrl = siteUrl.replace(/\/$/, '');
  const allUrls = new Set<string>();
  const allPdfUrls = new Set<string>();
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [];

  const fetchWithTimeout = async (url: string): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AccessEval/1.0 (accessibility scanner; contact@accesseval.com)',
        },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // Step 1: Try sitemap.xml
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const sitemapContent = await fetchWithTimeout(sitemapUrl);

  if (sitemapContent) {
    const sitemapResult = parseSitemapXml(sitemapContent, baseUrl);

    if (Array.isArray(sitemapResult)) {
      // Regular urlset — add all to our pool
      for (const url of sitemapResult) {
        allUrls.add(normalizeUrl(url));
      }
    } else {
      // Sitemap index — fetch child sitemaps
      for (const childSitemapUrl of sitemapResult.sitemapUrls) {
        const childContent = await fetchWithTimeout(childSitemapUrl);
        if (childContent) {
          const childResult = parseSitemapXml(childContent, baseUrl);
          if (Array.isArray(childResult)) {
            for (const url of childResult) {
              allUrls.add(normalizeUrl(url));
            }
          }
        }
      }
    }
  }

  // Step 2: Spider from homepage (depth 3)
  queue.push({ url: normalizeUrl(`${baseUrl}/`), depth: 0 });

  while (queue.length > 0 && allUrls.size < maxPages) {
    const item = queue.shift()!;
    const { url, depth } = item;

    if (visited.has(url)) continue;
    visited.add(url);

    if (url.toLowerCase().endsWith('.pdf')) {
      allPdfUrls.add(url);
      continue;
    }

    allUrls.add(url);

    if (depth >= 3) continue;

    const html = await fetchWithTimeout(url);
    if (!html) continue;

    const extracted = extractInternalLinks(html, baseUrl, { collectPdfs: true }) as {
      pageUrls: string[];
      pdfUrls: string[];
    };

    for (const pdfUrl of extracted.pdfUrls) {
      allPdfUrls.add(normalizeUrl(pdfUrl));
    }

    for (const link of extracted.pageUrls) {
      const normalized = normalizeUrl(link);
      if (!visited.has(normalized) && !allUrls.has(normalized)) {
        queue.push({ url: normalized, depth: depth + 1 });
      }
    }

    if (onProgress) {
      onProgress(visited.size, Math.min(allUrls.size, maxPages));
    }
  }

  const urlArray = Array.from(allUrls).slice(0, maxPages);
  const pdfArray = Array.from(allPdfUrls);

  return { urls: urlArray, pdfUrls: pdfArray };
}
