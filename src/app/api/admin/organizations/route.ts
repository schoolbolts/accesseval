import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { prisma } from '@/lib/db';

/** GET /api/admin/organizations — list all orgs with usage data */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const search = req.nextUrl.searchParams.get('search') || '';
  const planFilter = req.nextUrl.searchParams.get('plan') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  if (planFilter) {
    where.plan = planFilter;
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planStatus: true,
        stripeCustomerId: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
        _count: { select: { users: true, sites: true } },
        users: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { email: true, name: true },
        },
        sites: {
          select: {
            id: true,
            url: true,
            cmsType: true,
            _count: { select: { scans: true } },
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  const results = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    planStatus: org.planStatus,
    stripeCustomerId: org.stripeCustomerId,
    ownerEmail: org.users[0]?.email || null,
    ownerName: org.users[0]?.name || null,
    userCount: org._count.users,
    siteCount: org._count.sites,
    sites: org.sites.map((s) => ({
      url: s.url,
      cmsType: s.cmsType,
      scanCount: s._count.scans,
    })),
    utm: [org.utmSource, org.utmMedium, org.utmCampaign].filter(Boolean).join(' / ') || null,
    createdAt: org.createdAt,
  }));

  return NextResponse.json({ organizations: results, total, page, pages: Math.ceil(total / limit) });
}
