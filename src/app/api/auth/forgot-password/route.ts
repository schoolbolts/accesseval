import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { sendTemplateEmail } from '@/lib/email';
import PasswordResetEmail from '../../../../../emails/password-reset';
import { createElement } from 'react';

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    message: 'If an account with that email exists, we sent a password reset link.',
  });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return successResponse;

  // Invalidate any existing reset tokens for this email
  await prisma.authToken.updateMany({
    where: { email: user.email, type: 'password_reset', usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomUUID();
  await prisma.authToken.create({
    data: {
      email: user.email,
      token,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendTemplateEmail({
      to: user.email,
      subject: 'Reset your AccessEval password',
      component: createElement(PasswordResetEmail, { resetUrl }),
    });
  } catch {
    // Log but don't expose email delivery errors
  }

  return successResponse;
}
