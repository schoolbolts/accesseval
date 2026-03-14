import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFeature } from '@/lib/plan-limits';
import { renderToBuffer } from '@react-pdf/renderer';
import { BoardReport } from '@/components/reports/board-report';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!canUseFeature(user.plan, 'boardReport')) {
    return NextResponse.json({ error: 'Board reports require Comply plan or above' }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: { site: true, statement: true },
  });
  if (!org?.site) return NextResponse.json({ error: 'No site' }, { status: 404 });

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: org.site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
  });
  if (!latestScan) return NextResponse.json({ error: 'No scans available' }, { status: 404 });

  const topIssues = await prisma.issue.findMany({
    where: { scanId: latestScan.id },
    orderBy: [{ severity: 'asc' }],
    take: 10,
    select: { description: true, severity: true, wcagCriteria: true },
  });

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const issuesFixed = await prisma.siteIssue.count({
    where: { siteId: org.site.id, status: 'fixed', statusChangedAt: { gte: monthAgo } },
  });

  const pdfCount = await prisma.pdfAsset.count({ where: { scanId: latestScan.id } });

  const pdfBuffer = await renderToBuffer(
    BoardReport({
      orgName: org.name,
      siteUrl: org.site.url,
      reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      grade: latestScan.grade || 'N/A',
      score: latestScan.score || 0,
      criticalCount: latestScan.criticalCount,
      majorCount: latestScan.majorCount,
      minorCount: latestScan.minorCount,
      issuesFixed,
      topIssues: topIssues.map((i) => ({
        description: i.description,
        severity: i.severity,
        wcag: i.wcagCriteria,
      })),
      pdfCount,
      hasStatement: !!org.statement,
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="accesseval-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
