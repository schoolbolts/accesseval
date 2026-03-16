import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: { token: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { token } = params;

  const freeScan = await prisma.freeScan.findUnique({
    where: { token },
  });

  if (!freeScan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (freeScan.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Scan expired' }, { status: 410 });
  }

  if (freeScan.score === null) {
    return NextResponse.json({ status: 'processing' });
  }

  // Determine how many issues to return based on email
  const hasEmail = !!freeScan.email;
  const issueLimit = hasEmail ? 5 : 3;

  const resultsJson = freeScan.resultsJson as {
    error?: string;
    issues?: Array<{
      severity: string;
      description: string;
      fixInstructions: string;
      fixInstructionsCms?: string | null;
      wcagCriteria?: string;
      elementHtml?: string;
      elementScreenshotUrl?: string | null;
    }>;
    screenshotUrl?: string | null;
    narrative?: string;
    detectedCms?: string;
  } | null;

  const allIssues = resultsJson?.issues ?? [];
  const issues = allIssues.slice(0, issueLimit);

  return NextResponse.json({
    status: 'complete',
    url: freeScan.url,
    score: freeScan.score,
    grade: freeScan.grade,
    criticalCount: freeScan.criticalCount,
    majorCount: freeScan.majorCount,
    minorCount: freeScan.minorCount,
    issues,
    totalIssues: allIssues.length,
    hasEmail,
    scanError: resultsJson?.error ?? null,
    screenshotUrl: resultsJson?.screenshotUrl ?? null,
    narrative: resultsJson?.narrative ?? null,
    detectedCms: resultsJson?.detectedCms ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { token } = params;

  const body = await req.json().catch(() => ({}));
  const { email } = body as { email?: string };

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const freeScan = await prisma.freeScan.findUnique({
    where: { token },
  });

  if (!freeScan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (freeScan.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Scan expired' }, { status: 410 });
  }

  await prisma.freeScan.update({
    where: { token },
    data: { email },
  });

  return NextResponse.json({ success: true });
}
