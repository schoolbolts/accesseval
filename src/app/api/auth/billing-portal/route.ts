import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCustomerPortalSession } from '@/lib/stripe';

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can manage billing' }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  try {
    const portalSession = await createCustomerPortalSession(
      org.stripeCustomerId,
      `${process.env.BASE_URL || 'http://localhost:3000'}/settings`
    );
    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Stripe billing portal error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
