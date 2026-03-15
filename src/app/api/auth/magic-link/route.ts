import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { sendTemplateEmail } from '@/lib/email';
import MagicLinkEmail from '../../../../../emails/magic-link';
import { createElement } from 'react';

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    message: 'If an account with that email exists, we sent a sign-in link.',
  });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return successResponse;

  // Invalidate existing magic link tokens for this email
  await prisma.authToken.updateMany({
    where: { email: user.email, type: 'magic_link', usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomUUID();
  await prisma.authToken.create({
    data: {
      email: user.email,
      token,
      type: 'magic_link',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}`;

  try {
    await sendTemplateEmail({
      to: user.email,
      subject: 'Sign in to AccessEval',
      component: createElement(MagicLinkEmail, { loginUrl }),
    });
  } catch {
    // Log but don't expose email delivery errors
  }

  return successResponse;
}
