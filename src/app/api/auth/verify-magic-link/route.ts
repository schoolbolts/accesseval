import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_link`);
  }

  const authToken = await prisma.authToken.findUnique({ where: { token } });

  if (!authToken || authToken.type !== 'magic_link' || authToken.usedAt || authToken.expiresAt < new Date()) {
    return NextResponse.redirect(`${baseUrl}/login?error=expired_link`);
  }

  const user = await prisma.user.findUnique({
    where: { email: authToken.email },
    include: { organization: true },
  });

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_account`);
  }

  // Mark token as used
  await prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } });

  // Create a NextAuth JWT session manually
  const secret = process.env.NEXTAUTH_SECRET!;
  const jwt = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
      plan: user.organization.plan,
    },
    secret,
  });

  // Set the session cookie
  const cookieStore = await cookies();
  const isSecure = baseUrl.startsWith('https');
  const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

  cookieStore.set(cookieName, jwt, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
