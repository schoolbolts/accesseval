import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';

function generateStatementHtml(params: {
  entityName: string;
  entityType: string;
  contactEmail: string;
  contactPhone?: string;
  siteUrl: string;
  openIssueCount: number;
  lastScanDate: string;
}): string {
  const entityLabel = params.entityType.replace('_', ' ');
  return `
<h1>Accessibility Statement</h1>
<p>${params.entityName} is committed to ensuring digital accessibility for people with disabilities.
We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

<h2>Conformance Status</h2>
<p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA.
Our website was last scanned on ${params.lastScanDate}.
${params.openIssueCount > 0
  ? `We are aware of ${params.openIssueCount} accessibility issue${params.openIssueCount > 1 ? 's' : ''} and are actively working to resolve them.`
  : 'No known accessibility issues were found at the time of the last scan.'}</p>

<h2>Feedback</h2>
<p>We welcome your feedback on the accessibility of our website. Please let us know if you encounter
accessibility barriers:</p>
<ul>
<li>Email: <a href="mailto:${params.contactEmail}">${params.contactEmail}</a></li>
${params.contactPhone ? `<li>Phone: ${params.contactPhone}</li>` : ''}
</ul>

<h2>Enforcement</h2>
<p>This ${entityLabel} is subject to ADA Title II requirements for web accessibility.</p>
`.trim();
}

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const statement = await prisma.accessibilityStatement.findUnique({
    where: { organizationId: user.organizationId },
  });

  return NextResponse.json({ statement });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!canUseFeature(user.plan, 'accessibilityStatement')) {
    return NextResponse.json({ error: 'Accessibility statements require Comply plan' }, { status: 403 });
  }

  const body = await request.json();
  const { entityName, entityType, contactEmail, contactPhone } = body;

  if (!entityName || !entityType || !contactEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const [site, org] = await Promise.all([
    getActiveSite(user.organizationId),
    prisma.organization.findUnique({ where: { id: user.organizationId }, select: { slug: true } }),
  ]);
  if (!site) return NextResponse.json({ error: 'No site' }, { status: 404 });

  const openIssueCount = await prisma.siteIssue.count({
    where: { siteId: site.id, status: 'open' },
  });

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
  });

  const html = generateStatementHtml({
    entityName,
    entityType,
    contactEmail,
    contactPhone,
    siteUrl: site.url,
    openIssueCount,
    lastScanDate: latestScan?.completedAt?.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }) || 'N/A',
  });

  const statement = await prisma.accessibilityStatement.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      entityName,
      entityType: entityType as any,
      contactEmail,
      contactPhone,
      statementHtml: html,
    },
    update: {
      entityName,
      entityType: entityType as any,
      contactEmail,
      contactPhone,
      statementHtml: html,
      lastGeneratedAt: new Date(),
    },
  });

  return NextResponse.json({ statement, publicUrl: `/statement/${org?.slug}` });
}
