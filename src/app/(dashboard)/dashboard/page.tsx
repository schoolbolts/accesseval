import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

const ScoreTrend = dynamic(() => import('@/components/charts/score-trend'), { ssr: false });

function gradeColor(grade: string | null) {
  if (!grade) return 'text-gray-400';
  if (grade === 'A') return 'text-green-600';
  if (grade === 'B') return 'text-blue-600';
  if (grade === 'C') return 'text-yellow-600';
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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">No site configured yet.</p>
          <p className="text-sm text-gray-400">Set up your site in Settings to start scanning.</p>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">{site.url}</p>

      {noScans ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">--</div>
          <p className="text-gray-500 text-sm">No scans completed yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Your first scan will run automatically or you can trigger one manually.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Grade */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
              <span className={`text-5xl font-extrabold ${gradeColor(latestScan.grade)}`}>
                {latestScan.grade ?? '--'}
              </span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Grade</span>
              {latestScan.score != null && (
                <span className="text-sm text-gray-400 mt-0.5">{latestScan.score}/100</span>
              )}
            </div>

            {/* Critical */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-red-600">{latestScan.criticalCount}</span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Critical</span>
            </div>

            {/* Major */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-orange-500">{latestScan.majorCount}</span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Major</span>
            </div>

            {/* Minor */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-yellow-500">{latestScan.minorCount}</span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Minor</span>
            </div>
          </div>

          {/* Issue tracking row */}
          {hasIssueTracking && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-2xl font-bold text-gray-900">{openIssues}</div>
                <div className="text-sm text-gray-500 mt-1">Open issues</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-2xl font-bold text-green-600">{fixedThisMonth}</div>
                <div className="text-sm text-gray-500 mt-1">Fixed this month</div>
              </div>
            </div>
          )}

          {/* Score trend chart */}
          {hasProgressChart && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Score Trend
              </h2>
              <ScoreTrend data={trendData} />
            </div>
          )}

          {/* Last scan info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Last Scan
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-gray-400">Status</dt>
                <dd className="font-medium text-gray-800 capitalize">{latestScan.status}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Pages scanned</dt>
                <dd className="font-medium text-gray-800">
                  {latestScan.pagesScanned} / {latestScan.pagesFound}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Trigger</dt>
                <dd className="font-medium text-gray-800 capitalize">{latestScan.triggeredBy}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Completed</dt>
                <dd className="font-medium text-gray-800">
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
