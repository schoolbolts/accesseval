import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Look up the issue to get its fingerprint, then find the SiteIssue
  const issue = await prisma.issue.findUnique({
    where: { id },
    select: { fingerprint: true, scan: { select: { siteId: true } } },
  });

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Verify the site belongs to the user's organization
  const site = await prisma.site.findFirst({
    where: {
      id: issue.scan.siteId,
      organizationId: session.user.organizationId,
    },
    select: { id: true },
  });

  if (!site) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.status !== 'ignored') {
    return NextResponse.json({ error: 'Only status "ignored" is supported' }, { status: 400 });
  }

  const siteIssue = await prisma.siteIssue.updateMany({
    where: { siteId: site.id, fingerprint: issue.fingerprint },
    data: { status: 'ignored', statusChangedAt: new Date() },
  });

  return NextResponse.json({ updated: siteIssue.count });
}
