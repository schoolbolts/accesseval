import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { prisma } from '@/lib/db';

/** GET /api/admin/scans — list all scans across all orgs */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const statusFilter = req.nextUrl.searchParams.get('status') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [scans, total] = await Promise.all([
    prisma.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        triggeredBy: true,
        pagesFound: true,
        pagesScanned: true,
        score: true,
        grade: true,
        criticalCount: true,
        majorCount: true,
        minorCount: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        site: {
          select: {
            url: true,
            organization: { select: { name: true, slug: true, plan: true } },
          },
        },
      },
    }),
    prisma.scan.count({ where }),
  ]);

  const results = scans.map((s) => ({
    id: s.id,
    status: s.status,
    triggeredBy: s.triggeredBy,
    pagesFound: s.pagesFound,
    pagesScanned: s.pagesScanned,
    score: s.score,
    grade: s.grade,
    issues: { critical: s.criticalCount, major: s.majorCount, minor: s.minorCount },
    errorMessage: s.errorMessage,
    siteUrl: s.site.url,
    orgName: s.site.organization.name,
    orgPlan: s.site.organization.plan,
    createdAt: s.createdAt,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    duration: s.startedAt && s.completedAt
      ? Math.round((new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
      : null,
  }));

  return NextResponse.json({ scans: results, total, page, pages: Math.ceil(total / limit) });
}
