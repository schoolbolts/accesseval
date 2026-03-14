import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getMaxSites } from '@/lib/plan-limits';
import { ACTIVE_SITE_COOKIE } from '@/lib/active-site';
import type { PlanName } from '@/lib/plan-limits';

/** GET /api/sites — list all sites for the org */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sites = await prisma.site.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      url: true,
      cmsType: true,
      scanFrequency: true,
      maxPages: true,
      createdAt: true,
    },
  });

  const cookieStore = await cookies();
  const activeSiteId = cookieStore.get(ACTIVE_SITE_COOKIE)?.value ?? sites[0]?.id ?? null;

  return NextResponse.json({ sites, activeSiteId });
}

/** POST /api/sites — add a new site */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plan = session.user.plan as PlanName;
  const maxSites = getMaxSites(plan);

  const currentCount = await prisma.site.count({
    where: { organizationId: session.user.organizationId },
  });

  if (currentCount >= maxSites) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows up to ${maxSites} site${maxSites > 1 ? 's' : ''}. Upgrade to add more.` },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { url } = body as { url?: string };

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check for duplicate URL in this org
  const existing = await prisma.site.findFirst({
    where: { organizationId: session.user.organizationId, url: normalizedUrl },
  });
  if (existing) {
    return NextResponse.json({ error: 'This site URL is already added' }, { status: 409 });
  }

  const site = await prisma.site.create({
    data: {
      organizationId: session.user.organizationId,
      url: normalizedUrl,
      maxPages: (await import('@/lib/plan-limits')).PLAN_LIMITS[plan].maxPages,
    },
  });

  // Set as active site
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SITE_COOKIE, site.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ site }, { status: 201 });
}
