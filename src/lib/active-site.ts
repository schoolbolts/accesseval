import { cookies } from 'next/headers';
import { prisma } from './db';

export const ACTIVE_SITE_COOKIE = 'active-site-id';

/**
 * Resolve the active site for a given organization.
 * Reads the `active-site-id` cookie; falls back to the org's first site.
 * Optionally accepts an explicit siteId (e.g. from a query param).
 */
export async function getActiveSite(
  organizationId: string,
  explicitSiteId?: string | null,
) {
  // 1. Explicit siteId takes priority
  if (explicitSiteId) {
    const site = await prisma.site.findFirst({
      where: { id: explicitSiteId, organizationId },
    });
    if (site) return site;
  }

  // 2. Check cookie
  const cookieStore = await cookies();
  const cookieSiteId = cookieStore.get(ACTIVE_SITE_COOKIE)?.value;
  if (cookieSiteId) {
    const site = await prisma.site.findFirst({
      where: { id: cookieSiteId, organizationId },
    });
    if (site) return site;
  }

  // 3. Fall back to first site
  return prisma.site.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get all sites for an organization.
 */
export async function getOrgSites(organizationId: string) {
  return prisma.site.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      url: true,
      createdAt: true,
    },
  });
}
