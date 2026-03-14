import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import TriggerScanButton from '@/components/history/trigger-scan-button';

function gradeColor(grade: string | null) {
  if (!grade) return 'text-gray-400';
  if (grade === 'A') return 'text-green-600';
  if (grade === 'B') return 'text-blue-600';
  if (grade === 'C') return 'text-yellow-600';
  if (grade === 'D') return 'text-orange-600';
  return 'text-red-600';
}

const statusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  queued: 'bg-gray-100 text-gray-500',
  crawling: 'bg-blue-100 text-blue-700',
  scanning: 'bg-blue-100 text-blue-700',
};

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true, url: true },
  });

  if (!site) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Scan History</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No site configured yet.</p>
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
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          <p className="text-sm text-gray-500 mt-0.5">{site.url}</p>
        </div>
        <TriggerScanButton />
      </div>


      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Date
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Grade
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Score
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Pages
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Critical
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Major
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Minor
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Trigger
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scans.map((scan) => (
              <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
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
                <td className={`px-4 py-3 text-center font-bold ${gradeColor(scan.grade)}`}>
                  {scan.grade ?? '--'}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {scan.score != null ? scan.score : '--'}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {scan.pagesScanned}/{scan.pagesFound}
                </td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">
                  {scan.criticalCount}
                </td>
                <td className="px-4 py-3 text-center text-orange-500 font-medium">
                  {scan.majorCount}
                </td>
                <td className="px-4 py-3 text-center text-yellow-500 font-medium">
                  {scan.minorCount}
                </td>
                <td className="px-4 py-3 text-center text-gray-500 capitalize">
                  {scan.triggeredBy}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      statusBadge[scan.status] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {scan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No scans yet.</div>
        )}
      </div>
    </div>
  );
}

