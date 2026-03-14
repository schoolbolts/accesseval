import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSite } from '@/lib/active-site';
import { prisma } from '@/lib/db';
import { scanQueue } from '@/lib/queue';
import { getOnDemandLimit } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = session.user.plan as PlanName;
  const onDemandLimit = getOnDemandLimit(plan);

  // Accept optional siteId in body, otherwise use active site
  let siteId: string | undefined;
  try {
    const body = await req.json();
    siteId = body.siteId;
  } catch {}

  const site = await getActiveSite(session.user.organizationId, siteId);

  if (!site) {
    return NextResponse.json({ error: 'No site configured' }, { status: 404 });
  }

  // Reset monthly counter if past reset date
  const now = new Date();
  const resetAt = new Date(site.onDemandResetAt);
  let used = site.onDemandScansUsed;

  if (
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear()
  ) {
    await prisma.site.update({
      where: { id: site.id },
      data: { onDemandScansUsed: 0, onDemandResetAt: now },
    });
    used = 0;
  }

  // Check limit (Infinity means unlimited)
  if (isFinite(onDemandLimit) && used >= onDemandLimit) {
    return NextResponse.json(
      { error: `On-demand scan limit reached (${onDemandLimit}/month for your plan)` },
      { status: 429 }
    );
  }

  // Check for active scan
  const activeScan = await prisma.scan.findFirst({
    where: {
      siteId: site.id,
      status: { in: ['queued', 'crawling', 'scanning'] },
    },
    select: { id: true, status: true },
  });

  if (activeScan) {
    return NextResponse.json(
      { error: 'A scan is already in progress', scanId: activeScan.id },
      { status: 409 }
    );
  }

  // Create scan record
  const scan = await prisma.scan.create({
    data: {
      siteId: site.id,
      status: 'queued',
      triggeredBy: 'manual',
    },
  });

  // Increment on-demand counter
  await prisma.site.update({
    where: { id: site.id },
    data: { onDemandScansUsed: { increment: 1 } },
  });

  // Enqueue the job
  await scanQueue.add('scan', { scanId: scan.id, siteId: site.id });

  return NextResponse.json({ scanId: scan.id }, { status: 201 });
}
