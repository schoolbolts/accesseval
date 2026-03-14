import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!site) {
    return NextResponse.json({ scans: [] });
  }

  const scans = await prisma.scan.findMany({
    where: {
      siteId: site.id,
      status: { in: ['completed', 'partial'] },
    },
    orderBy: { completedAt: 'desc' },
    take: 20,
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
      createdAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({ scans });
}
