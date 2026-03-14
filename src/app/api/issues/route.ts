import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import type { IssueSeverity } from '@prisma/client';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const severityParam = searchParams.get('severity');
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return NextResponse.json({ issues: [], total: 0, page, pageSize: PAGE_SIZE });
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });

  if (!latestScan) {
    return NextResponse.json({ issues: [], total: 0, page, pageSize: PAGE_SIZE });
  }

  const validSeverities: IssueSeverity[] = ['critical', 'major', 'minor'];
  const severityFilter =
    severityParam && validSeverities.includes(severityParam as IssueSeverity)
      ? (severityParam as IssueSeverity)
      : undefined;

  const where = {
    scanId: latestScan.id,
    ...(severityFilter ? { severity: severityFilter } : {}),
  };

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        axeRuleId: true,
        severity: true,
        description: true,
        fixInstructions: true,
        fixInstructionsCms: true,
        elementSelector: true,
        elementHtml: true,
        wcagCriteria: true,
        fingerprint: true,
        page: { select: { url: true, title: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);

  return NextResponse.json({ issues, total, page, pageSize: PAGE_SIZE });
}
