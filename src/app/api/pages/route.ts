import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return NextResponse.json({ pages: [] });
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });

  if (!latestScan) {
    return NextResponse.json({ pages: [] });
  }

  const pages = await prisma.page.findMany({
    where: { scanId: latestScan.id },
    orderBy: [{ pageScore: 'asc' }, { url: 'asc' }],
    select: {
      id: true,
      url: true,
      title: true,
      status: true,
      issueCount: true,
      pageScore: true,
      scannedAt: true,
    },
  });

  return NextResponse.json({ pages });
}
