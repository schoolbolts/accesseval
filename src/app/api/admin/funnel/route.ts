import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Aggregate counts per event type
  const [viewCount, emailCount, signupClickCount] = await Promise.all([
    prisma.funnelEvent.count({ where: { event: 'view', createdAt: { gte: since } } }),
    prisma.funnelEvent.count({ where: { event: 'email', createdAt: { gte: since } } }),
    prisma.funnelEvent.count({ where: { event: 'signup_click', createdAt: { gte: since } } }),
  ]);

  // Daily breakdown for the chart
  const daily = await prisma.$queryRawUnsafe<
    Array<{ day: string; event: string; count: bigint }>
  >(
    `SELECT DATE(created_at) as day, event, COUNT(*)::bigint as count
     FROM funnel_events
     WHERE created_at >= $1
     GROUP BY DATE(created_at), event
     ORDER BY day`,
    since,
  );

  // Convert bigints to numbers
  const dailyData = daily.map((r) => ({
    day: String(r.day).slice(0, 10),
    event: r.event,
    count: Number(r.count),
  }));

  // Recent events for the table
  const recent = await prisma.funnelEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    totals: {
      views: viewCount,
      emails: emailCount,
      signupClicks: signupClickCount,
    },
    rates: {
      emailRate: viewCount > 0 ? ((emailCount / viewCount) * 100).toFixed(1) : '0.0',
      signupRate: emailCount > 0 ? ((signupClickCount / emailCount) * 100).toFixed(1) : '0.0',
      overallRate: viewCount > 0 ? ((signupClickCount / viewCount) * 100).toFixed(1) : '0.0',
    },
    daily: dailyData,
    recent,
  });
}
