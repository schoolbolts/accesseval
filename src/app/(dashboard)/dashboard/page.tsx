import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

const ScoreTrend = dynamic(() => import('@/components/charts/score-trend'), { ssr: false });
const TriggerScanButton = dynamic(() => import('@/components/history/trigger-scan-button'), { ssr: false });
const ActiveScanBanner = dynamic(() => import('@/components/dashboard/active-scan-banner'), { ssr: false });

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-400';
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

function gradeRingColor(grade: string | null) {
  if (!grade) return 'ring-slate-200';
  if (grade.startsWith('A')) return 'ring-emerald-400';
  if (grade.startsWith('B')) return 'ring-blue-400';
  if (grade.startsWith('C')) return 'ring-amber-400';
  if (grade.startsWith('D')) return 'ring-orange-400';
  return 'ring-red-400';
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasIssueTracking = canUseFeature(plan, 'issueTracking');
  const hasProgressChart = canUseFeature(plan, 'progressChart');

  const fullSite = await getActiveSite(session.user.organizationId);
  const site = fullSite ? { id: fullSite.id, url: fullSite.url } : null;

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

  const activeScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['queued', 'crawling', 'scanning'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, pagesFound: true, pagesScanned: true, createdAt: true },
  });

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
  });

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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle mt-1">{site.url}</p>
        </div>
        {!activeScan && (
          <div className="shrink-0">
            <TriggerScanButton />
          </div>
        )}
      </div>

      {/* Active scan banner — polls every 3s, auto-refreshes page when scan completes */}
      <ActiveScanBanner initial={activeScan ? {
        id: activeScan.id,
        status: activeScan.status as 'queued' | 'crawling' | 'scanning',
        pagesFound: activeScan.pagesFound,
        pagesScanned: activeScan.pagesScanned,
      } : null} />

      {/* Empty state — no scans ever and nothing running */}
      {!latestScan && !activeScan && (
        <div className="animate-fade-up stagger-1">
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h2 className="font-display text-display-sm text-ink mb-2">Run your first scan</h2>
            <p className="font-body text-sm text-slate-500 max-w-sm mx-auto mb-6">
              We&apos;ll crawl your site and check every page for accessibility issues against WCAG 2.1 AA standards.
            </p>
            <div className="flex justify-center">
              <TriggerScanButton />
            </div>
          </div>
        </div>
      )}

      {/* Results — only render when we have a completed scan */}
      {latestScan && (
        <>
          {/* Grade hero + stat cards */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            {/* Grade circle — spans 2 cols */}
            <div className="lg:col-span-2 card p-8 flex flex-col items-center justify-center text-center animate-fade-up stagger-1">
              <div className={`w-28 h-28 rounded-full ring-[5px] ${gradeRingColor(latestScan.grade)} flex items-center justify-center mb-4`}>
                <span className={`font-display text-5xl font-extrabold leading-none ${gradeColor(latestScan.grade)}`}>
                  {latestScan.grade ?? '--'}
                </span>
              </div>
              {latestScan.score != null && (
                <p className="font-display text-display-sm text-ink">{latestScan.score}<span className="text-slate-400">/100</span></p>
              )}
              <p className="font-body text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">Accessibility Score</p>
            </div>

            {/* Issue counts — 3 stat cards */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-4">
              <div className="stat-card animate-fade-up stagger-2">
                <span className="stat-value text-red-500">{latestScan.criticalCount ?? 0}</span>
                <span className="stat-label">Critical</span>
              </div>
              <div className="stat-card animate-fade-up stagger-3">
                <span className="stat-value text-orange-500">{latestScan.majorCount ?? 0}</span>
                <span className="stat-label">Major</span>
              </div>
              <div className="stat-card animate-fade-up stagger-4">
                <span className="stat-value text-amber-500">{latestScan.minorCount ?? 0}</span>
                <span className="stat-label">Minor</span>
              </div>
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

          {/* AI Summary */}
          {latestScan.summary && (
            <div className="card p-6 mb-6 animate-fade-up stagger-5">
              <h2 className="section-title mb-4">What This Means</h2>
              <div
                className="prose-ae font-body text-sm text-slate-700 leading-relaxed space-y-3 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:pl-1"
                dangerouslySetInnerHTML={{
                  __html: latestScan.summary
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .split('\n\n')
                    .map((block: string) => {
                      const lines = block.split('\n');
                      const isList = lines.every((l: string) => l.startsWith('• ') || l.trim() === '');
                      if (isList) {
                        const items = lines
                          .filter((l: string) => l.startsWith('• '))
                          .map((l: string) => `<li>${l.slice(2)}</li>`)
                          .join('');
                        return `<ul>${items}</ul>`;
                      }
                      return `<p>${block}</p>`;
                    })
                    .join(''),
                }}
              />
            </div>
          )}

          {/* Score trend chart */}
          {hasProgressChart && trendData.length > 0 && (
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
                  {latestScan.pagesScanned ?? 0} / {latestScan.pagesFound ?? 0}
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
