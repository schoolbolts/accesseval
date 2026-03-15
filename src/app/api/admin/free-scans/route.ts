import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { prisma } from '@/lib/db';

/** GET /api/admin/free-scans — list all free scans for marketing/conversion analysis */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const emailOnly = req.nextUrl.searchParams.get('emailOnly') === 'true';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = 100;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (emailOnly) {
    where.email = { not: null };
  }

  const [scans, total] = await Promise.all([
    prisma.freeScan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        url: true,
        email: true,
        token: true,
        score: true,
        grade: true,
        criticalCount: true,
        majorCount: true,
        minorCount: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
    prisma.freeScan.count({ where }),
  ]);

  // Check which free scan emails later signed up
  const emailsFromScans = scans.map((s) => s.email).filter(Boolean) as string[];
  const convertedEmails = emailsFromScans.length > 0
    ? await prisma.user.findMany({
        where: { email: { in: emailsFromScans } },
        select: { email: true },
      }).then((users) => new Set(users.map((u) => u.email)))
    : new Set<string>();

  const results = scans.map((s) => ({
    id: s.id,
    url: s.url,
    email: s.email,
    token: s.token,
    score: s.score,
    grade: s.grade,
    issues: { critical: s.criticalCount, major: s.majorCount, minor: s.minorCount },
    converted: s.email ? convertedEmails.has(s.email) : false,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
  }));

  return NextResponse.json({ freeScans: results, total, page, pages: Math.ceil(total / limit) });
}
