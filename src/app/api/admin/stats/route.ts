import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rob@schoolbolts.com').split(',');

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = (session.user as any)?.email;
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalOrgs,
    activeOrgs,
    canceledOrgs,
    totalUsers,
    freeScansTotal,
    freeScansWeek,
    freeScansWithEmail,
    signupsMonth,
    signupsWeek,
    planDistribution,
    utmSources,
    recentSignups,
    recentFreeScans,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { planStatus: 'active' } }),
    prisma.organization.count({ where: { planStatus: 'canceled' } }),
    prisma.user.count(),
    prisma.freeScan.count(),
    prisma.freeScan.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.freeScan.count({ where: { email: { not: null } } }),
    prisma.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.organization.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.organization.groupBy({
      by: ['plan'],
      _count: { plan: true },
    }),
    prisma.organization.groupBy({
      by: ['utmSource'],
      where: { utmSource: { not: null } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: 'desc' } },
      take: 10,
    }),
    prisma.organization.findMany({
      select: {
        name: true,
        plan: true,
        planStatus: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
        users: { select: { email: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.freeScan.findMany({
      select: { url: true, email: true, grade: true, score: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const emailCaptureRate = freeScansTotal > 0
    ? Math.round((freeScansWithEmail / freeScansTotal) * 100)
    : 0;

  const planDist = Object.fromEntries(
    planDistribution.map((p) => [p.plan, p._count.plan])
  );

  // MRR calculation
  const prices: Record<string, number> = { scan: 99, comply: 299, fix: 599 };
  const mrr = planDistribution.reduce((sum, p) => {
    return sum + (prices[p.plan] || 0) * p._count.plan;
  }, 0);
  const arr = mrr; // prices are annual, so this IS ARR

  return NextResponse.json({
    overview: {
      totalOrgs,
      activeOrgs,
      canceledOrgs,
      totalUsers,
      arr,
      churnRate: totalOrgs > 0 ? Math.round((canceledOrgs / totalOrgs) * 100) : 0,
    },
    funnel: {
      freeScansTotal,
      freeScansWeek,
      freeScansWithEmail,
      emailCaptureRate,
      signupsMonth,
      signupsWeek,
    },
    planDistribution: planDist,
    utmSources: utmSources.map((u) => ({
      source: u.utmSource,
      count: u._count.utmSource,
    })),
    recentSignups: recentSignups.map((s) => ({
      name: s.name,
      email: s.users[0]?.email || '',
      plan: s.plan,
      status: s.planStatus,
      utm: s.utmSource ? `${s.utmSource}/${s.utmMedium || ''}/${s.utmCampaign || ''}` : null,
      date: s.createdAt,
    })),
    recentFreeScans: recentFreeScans.map((f) => ({
      url: f.url,
      email: f.email,
      grade: f.grade,
      score: f.score,
      date: f.createdAt,
    })),
  });
}
