import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTeamMemberLimit } from '@/lib/plan-limits';
import { v4 as uuid } from 'uuid';
import { notifyTeamInvite } from '../../../../worker/notifier';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: user.organizationId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 });
  }

  const body = await request.json();
  const { email } = body;

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  const memberCount = await prisma.user.count({
    where: { organizationId: user.organizationId },
  });
  const pendingCount = await prisma.invitation.count({
    where: { organizationId: user.organizationId, status: 'pending' },
  });
  const limit = getTeamMemberLimit(org.plan);

  if (memberCount + pendingCount >= limit) {
    return NextResponse.json(
      { error: `Team member limit reached (${limit}). Upgrade to add more.` },
      { status: 403 }
    );
  }

  const token = uuid();
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: user.organizationId,
      email,
      invitedBy: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  try {
    await notifyTeamInvite({
      email,
      orgName: org.name,
      inviterName: user.name || user.email || 'A team member',
      inviteToken: token,
    });
  } catch (error) {
    console.error('[invitations] Failed to send invite email:', error);
  }

  return NextResponse.json({
    invitation,
    inviteUrl: `${process.env.BASE_URL}/signup?invite=${token}`,
  });
}
