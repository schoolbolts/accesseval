import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ACTIVE_SITE_COOKIE } from '@/lib/active-site';

/** PUT /api/sites/active — switch the active site */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { siteId } = (await req.json()) as { siteId?: string };
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

  // Verify site belongs to org
  const site = await prisma.site.findFirst({
    where: { id: siteId, organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SITE_COOKIE, site.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ activeSiteId: site.id });
}
