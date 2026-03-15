import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { prisma } from '@/lib/db';

/** GET /api/admin/districts — list districts with scan data for marketing */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const state = req.nextUrl.searchParams.get('state') || '';
  const scanned = req.nextUrl.searchParams.get('scanned'); // 'true', 'false', or null for all
  const gradeFilter = req.nextUrl.searchParams.get('grade') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = 100;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (state) where.stateCode = state.toUpperCase();
  if (scanned === 'true') where.lastScannedAt = { not: null };
  if (scanned === 'false') where.lastScannedAt = null;
  if (gradeFilter) where.grade = gradeFilter;

  const [districts, total, totalScanned, totalUnscanned, gradeDistribution] = await Promise.all([
    prisma.district.findMany({
      where,
      orderBy: [{ score: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      select: {
        id: true,
        ncesId: true,
        name: true,
        slug: true,
        website: true,
        city: true,
        stateCode: true,
        leaType: true,
        score: true,
        grade: true,
        criticalCount: true,
        majorCount: true,
        minorCount: true,
        lastScannedAt: true,
        screenshotUrl: true,
      },
    }),
    prisma.district.count({ where }),
    prisma.district.count({ where: { lastScannedAt: { not: null } } }),
    prisma.district.count({ where: { lastScannedAt: null } }),
    prisma.district.groupBy({
      by: ['grade'],
      where: { grade: { not: null } },
      _count: { grade: true },
    }),
  ]);

  const grades = Object.fromEntries(
    gradeDistribution.map((g) => [g.grade!, g._count.grade])
  );

  return NextResponse.json({
    districts,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: { totalScanned, totalUnscanned, grades },
  });
}
