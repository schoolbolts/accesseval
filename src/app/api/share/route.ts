import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFeature } from '@/lib/plan-limits';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!canUseFeature(user.plan, 'shareLinks')) {
    return NextResponse.json({ error: 'Share links require Comply plan' }, { status: 403 });
  }

  const body = await request.json();
  const { scanId } = body;

  if (!scanId) return NextResponse.json({ error: 'scanId required' }, { status: 400 });

  const scan = await prisma.scan.findFirst({
    where: { id: scanId, site: { organizationId: user.organizationId } },
  });
  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });

  const token = uuid();
  const _shareLink = await prisma.shareLink.create({
    data: {
      organizationId: user.organizationId,
      scanId,
      token,
    },
  });

  return NextResponse.json({
    url: `${process.env.BASE_URL}/share/${token}`,
    token,
  });
}
