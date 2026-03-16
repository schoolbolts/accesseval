import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import TriggerScanButton from '@/components/history/trigger-scan-button';

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-600';
  if (grade === 'A') return 'text-emerald-600';
  if (grade === 'B') return 'text-blue-600';
  if (grade === 'C') return 'text-amber-600';
  if (grade === 'D') return 'text-orange-600';
  return 'text-red-600';
}

function statusBadgeClass(status: string) {
  if (status === 'completed') return 'badge-success';
  if (status === 'partial') return 'badge-minor';
  if (status === 'failed') return 'badge-critical';
  return 'badge-info';
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="page-title mb-1">Scan History</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600 text-sm">No site configured yet.</p>
        </div>
      </div>
    );
  }

  const scans = await prisma.scan.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      triggeredBy: true,
      pagesFound: true,
      pagesScanned: true,
      score: true,
      grade: true,
      criticalCount: true,
      majorCount: true,
      minorCount: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">{site.url}</p>
        </div>
        <TriggerScanButton />
      </div>

      <div className="card overflow-hidden animate-fade-up stagger-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3.5 text-left section-title">Date</th>
              <th className="px-5 py-3.5 text-center section-title">Grade</th>
              <th className="px-5 py-3.5 text-center section-title">Score</th>
              <th className="px-5 py-3.5 text-center section-title">Pages</th>
              <th className="px-5 py-3.5 text-center section-title">Critical</th>
              <th className="px-5 py-3.5 text-center section-title">Major</th>
              <th className="px-5 py-3.5 text-center section-title">Minor</th>
              <th className="px-5 py-3.5 text-center section-title">Trigger</th>
              <th className="px-5 py-3.5 text-center section-title">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scans.map((scan) => (
              <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 font-body text-slate-700 whitespace-nowrap">
                  {scan.completedAt
                    ? new Date(scan.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : new Date(scan.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </td>
                <td className={`px-5 py-3.5 text-center font-display font-bold text-base ${gradeColor(scan.grade)}`}>
                  {scan.grade ?? '--'}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-slate-700">
                  {scan.score != null ? scan.score : '--'}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-slate-700">
                  {scan.pagesScanned}/{scan.pagesFound}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-red-600 font-medium">
                  {scan.criticalCount}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-orange-600 font-medium">
                  {scan.majorCount}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-amber-600 font-medium">
                  {scan.minorCount}
                </td>
                <td className="px-5 py-3.5 text-center font-body text-slate-600 capitalize">
                  {scan.triggeredBy}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={statusBadgeClass(scan.status)}>
                    {scan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 && (
          <div className="p-8 text-center text-slate-600 text-sm font-body">No scans yet.</div>
        )}
      </div>
    </div>
  );
}
