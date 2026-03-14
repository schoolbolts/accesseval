import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://accesseval.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/settings/', '/issues/', '/history/', '/reports/', '/statement/', '/pdfs/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
