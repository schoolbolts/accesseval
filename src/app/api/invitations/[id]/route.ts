import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can revoke invitations' }, { status: 403 });
  }

  await prisma.invitation.deleteMany({
    where: { id: params.id, organizationId: user.organizationId },
  });

  return NextResponse.json({ success: true });
}
