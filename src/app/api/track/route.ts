import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_EVENTS = ['view', 'email', 'signup_click'] as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, event } = body as { token?: string; event?: string };

  if (
    !token ||
    typeof token !== 'string' ||
    !event ||
    !VALID_EVENTS.includes(event as (typeof VALID_EVENTS)[number])
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Dedupe views — only one view event per token per session
  // (emails and signup_clicks are naturally rare, no need to dedupe)
  if (event === 'view') {
    const existing = await prisma.funnelEvent.findFirst({
      where: { token, event: 'view' },
    });
    if (existing) {
      return NextResponse.json({ ok: true });
    }
  }

  await prisma.funnelEvent.create({
    data: { token, event },
  });

  return NextResponse.json({ ok: true });
}
