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
    return NextResponse.json({ status: 'idle' });
  }

  const activeScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['queued', 'crawling', 'scanning'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, pagesFound: true, pagesScanned: true },
  });

  if (!activeScan) {
    return NextResponse.json({ status: 'idle' });
  }

  return NextResponse.json(activeScan);
}
