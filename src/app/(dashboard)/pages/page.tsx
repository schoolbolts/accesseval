import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function scoreColor(score: number | null) {
  if (score == null) return 'text-gray-400';
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

const statusBadge: Record<string, string> = {
  scanned: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
};

export default async function PagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!site) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pages</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No site configured yet.</p>
        </div>
      </div>
    );
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { id: true, completedAt: true },
  });

  if (!latestScan) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pages</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No completed scans yet.</p>
        </div>
      </div>
    );
  }

  const pages = await prisma.page.findMany({
    where: { scanId: latestScan.id },
    orderBy: [{ pageScore: 'asc' }, { url: 'asc' }],
    select: {
      id: true,
      url: true,
      title: true,
      status: true,
      issueCount: true,
      pageScore: true,
      scannedAt: true,
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {pages.length} pages from latest scan &mdash;{' '}
          {latestScan.completedAt
            ? new Date(latestScan.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'unknown date'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Page
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Score
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Issues
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 truncate max-w-sm">
                    {page.title || new URL(page.url).pathname || '/'}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-sm">{page.url}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${scoreColor(page.pageScore)}`}>
                    {page.pageScore != null ? page.pageScore : '--'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{page.issueCount}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      statusBadge[page.status] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {page.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No pages found.</div>
        )}
      </div>
    </div>
  );
}
