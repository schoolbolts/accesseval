import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

const ScoreTrend = dynamic(() => import('@/components/charts/score-trend'), { ssr: false });

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-400';
  if (grade === 'A') return 'text-emerald-600';
  if (grade === 'B') return 'text-blue-600';
  if (grade === 'C') return 'text-amber-600';
  if (grade === 'D') return 'text-orange-600';
  return 'text-red-600';
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasIssueTracking = canUseFeature(plan, 'issueTracking');
  const hasProgressChart = canUseFeature(plan, 'progressChart');

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true, url: true },
  });

  if (!site) {
    return (
      <div className="p-8 max-w-6xl">
        <h1 className="page-title mb-1">Dashboard</h1>
        <div className="card p-10 text-center mt-6">
          <p className="text-slate-500 mb-2">No site configured yet.</p>
          <p className="text-sm text-slate-400">Set up your site in Settings to start scanning.</p>
        </div>
      </div>
    );
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
  });

  // Score trend data (last 20 completed scans)
  const trendScans = hasProgressChart
    ? await prisma.scan.findMany({
        where: { siteId: site.id, status: { in: ['completed', 'partial'] }, score: { not: null } },
        orderBy: { completedAt: 'asc' },
        take: 20,
        select: { completedAt: true, score: true },
      })
    : [];

  const trendData = trendScans.map((s) => ({
    date: s.completedAt
      ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '',
    score: s.score ?? 0,
  }));

  // Issue tracking counts
  let openIssues = 0;
  let fixedThisMonth = 0;
  if (hasIssueTracking) {
    openIssues = await prisma.siteIssue.count({
      where: { siteId: site.id, status: 'open' },
    });
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    fixedThisMonth = await prisma.siteIssue.count({
      where: { siteId: site.id, status: 'fixed', statusChangedAt: { gte: firstOfMonth } },
    });
  }

  const noScans = !latestScan;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{site.url}</p>
      </div>

      {noScans ? (
        <div className="card p-10 text-center animate-fade-up stagger-1">
          <div className="text-5xl font-display font-bold text-slate-300 mb-4">--</div>
          <p className="text-slate-500 text-sm">No scans completed yet.</p>
          <p className="text-slate-400 text-xs mt-1">
            Your first scan will run automatically or you can trigger one manually.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Grade */}
            <div className="stat-card animate-fade-up stagger-1">
              <span className={`stat-value text-5xl ${gradeColor(latestScan.grade)}`}>
                {latestScan.grade ?? '--'}
              </span>
              <span className="stat-label">Grade</span>
              {latestScan.score != null && (
                <span className="text-xs text-slate-400 mt-1 font-body">{latestScan.score}/100</span>
              )}
            </div>

            {/* Critical */}
            <div className="stat-card animate-fade-up stagger-2">
              <span className="stat-value text-red-600">{latestScan.criticalCount}</span>
              <span className="stat-label">Critical</span>
            </div>

            {/* Major */}
            <div className="stat-card animate-fade-up stagger-3">
              <span className="stat-value text-orange-600">{latestScan.majorCount}</span>
              <span className="stat-label">Major</span>
            </div>

            {/* Minor */}
            <div className="stat-card animate-fade-up stagger-4">
              <span className="stat-value text-amber-600">{latestScan.minorCount}</span>
              <span className="stat-label">Minor</span>
            </div>
          </div>

          {/* Issue tracking row */}
          {hasIssueTracking && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card-padded animate-fade-up stagger-5">
                <div className="text-2xl font-display font-bold text-ink">{openIssues}</div>
                <div className="text-sm font-body text-slate-500 mt-1">Open issues</div>
              </div>
              <div className="card-padded animate-fade-up stagger-6">
                <div className="text-2xl font-display font-bold text-emerald-600">{fixedThisMonth}</div>
                <div className="text-sm font-body text-slate-500 mt-1">Fixed this month</div>
              </div>
            </div>
          )}

          {/* Score trend chart */}
          {hasProgressChart && (
            <div className="card p-6 mb-6 animate-fade-up stagger-5">
              <h2 className="section-title mb-4">Score Trend</h2>
              <ScoreTrend data={trendData} />
            </div>
          )}

          {/* Last scan info */}
          <div className="card p-6 animate-fade-up stagger-6">
            <h2 className="section-title mb-4">Last Scan</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-xs font-body text-slate-400 mb-1">Status</dt>
                <dd className="text-sm font-body font-medium text-ink capitalize">{latestScan.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-body text-slate-400 mb-1">Pages scanned</dt>
                <dd className="text-sm font-body font-medium text-ink">
                  {latestScan.pagesScanned} / {latestScan.pagesFound}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-body text-slate-400 mb-1">Trigger</dt>
                <dd className="text-sm font-body font-medium text-ink capitalize">{latestScan.triggeredBy}</dd>
              </div>
              <div>
                <dt className="text-xs font-body text-slate-400 mb-1">Completed</dt>
                <dd className="text-sm font-body font-medium text-ink">
                  {latestScan.completedAt
                    ? new Date(latestScan.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '--'}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </div>
  );
}
