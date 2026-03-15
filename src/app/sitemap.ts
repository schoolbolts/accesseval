import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { posts } from './(public)/blog/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://accesseval.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/schools`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // District pages (all 17K)
  let districtPages: MetadataRoute.Sitemap = [];
  try {
    const districts = await prisma.district.findMany({
      select: { slug: true, updatedAt: true },
    });
    districtPages = districts.map((d) => ({
      url: `${baseUrl}/schools/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: d.slug ? 0.5 : 0.4,
    }));
  } catch {}

  return [...staticPages, ...blogPages, ...districtPages];
}
