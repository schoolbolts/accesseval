import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = session.user.plan as PlanName;
  if (!canUseFeature(plan, 'pdfInventory')) {
    return NextResponse.json({ error: 'PDF inventory requires a higher plan' }, { status: 403 });
  }

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return NextResponse.json({ pdfs: [] });
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });

  if (!latestScan) {
    return NextResponse.json({ pdfs: [] });
  }

  const pdfs = await prisma.pdfAsset.findMany({
    where: { scanId: latestScan.id },
    orderBy: { filename: 'asc' },
    select: {
      id: true,
      url: true,
      filename: true,
      sizeBytes: true,
      page: { select: { url: true, title: true } },
    },
  });

  // BigInt cannot be JSON-serialized directly
  const serialized = pdfs.map((p) => ({ ...p, sizeBytes: p.sizeBytes.toString() }));

  return NextResponse.json({ pdfs: serialized });
}
