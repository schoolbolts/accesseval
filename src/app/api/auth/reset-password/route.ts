import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { validatePassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json()) as { token?: string; password?: string };

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
  }

  const { valid, errors } = validatePassword(password);
  if (!valid) {
    return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
  }

  const authToken = await prisma.authToken.findUnique({ where: { token } });

  if (!authToken || authToken.type !== 'password_reset' || authToken.usedAt || authToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: authToken.email } });
  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ message: 'Password has been reset. You can now sign in.' });
}
