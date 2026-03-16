import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';
import { renderToBuffer } from '@react-pdf/renderer';
import { BoardReport } from '@/components/reports/board-report';

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!canUseFeature(user.plan, 'boardReport')) {
    return NextResponse.json({ error: 'Board reports require Comply plan or above' }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: { statement: true },
  });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const site = await getActiveSite(user.organizationId);
  if (!site) return NextResponse.json({ error: 'No site' }, { status: 404 });

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
  });
  if (!latestScan) return NextResponse.json({ error: 'No scans available' }, { status: 404 });

  // Group issues by axeRuleId to show unique issue types with counts
  const allIssues = await prisma.issue.findMany({
    where: { scanId: latestScan.id },
    select: { axeRuleId: true, description: true, severity: true, wcagCriteria: true },
  });

  const issueGroups = new Map<string, { description: string; severity: string; wcag: string | null; count: number }>();
  for (const issue of allIssues) {
    const key = issue.axeRuleId ?? issue.description;
    if (!issueGroups.has(key)) {
      issueGroups.set(key, {
        description: issue.description,
        severity: issue.severity,
        wcag: issue.wcagCriteria,
        count: 0,
      });
    }
    issueGroups.get(key)!.count++;
  }

  const sevOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  const topIssues = Array.from(issueGroups.values())
    .sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3) || b.count - a.count)
    .slice(0, 12);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const issuesFixed = await prisma.siteIssue.count({
    where: { siteId: site.id, status: 'fixed', statusChangedAt: { gte: monthAgo } },
  });

  const pdfCount = await prisma.pdfAsset.count({ where: { scanId: latestScan.id } });

  const scanDate = latestScan.completedAt
    ? latestScan.completedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const pdfBuffer = await renderToBuffer(
    BoardReport({
      orgName: org.name,
      siteUrl: site.url,
      reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      scanDate,
      grade: latestScan.grade || 'N/A',
      score: latestScan.score || 0,
      pagesScanned: latestScan.pagesScanned,
      criticalCount: latestScan.criticalCount,
      majorCount: latestScan.majorCount,
      minorCount: latestScan.minorCount,
      issuesFixed,
      summary: latestScan.summary,
      topIssues: topIssues.map((i) => ({
        description: i.description,
        severity: i.severity,
        wcag: i.wcag,
        count: i.count,
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
