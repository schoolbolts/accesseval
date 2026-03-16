import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';

function scoreColor(score: number | null) {
  if (score == null) return 'text-slate-600';
  if (score >= 90) return 'text-emerald-700';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function statusBadgeClass(status: string) {
  if (status === 'scanned') return 'badge-success';
  if (status === 'error') return 'badge-critical';
  return 'badge-info';
}

export default async function PagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="page-title mb-1">Pages</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600 text-sm">No site configured yet.</p>
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
      <div className="p-8 max-w-7xl">
        <h1 className="page-title mb-1">Pages</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600 text-sm">No completed scans yet.</p>
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
    <div className="p-8 max-w-7xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Pages</h1>
        <p className="page-subtitle">
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

      <div className="card overflow-hidden animate-fade-up stagger-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3.5 text-left section-title">Page</th>
              <th className="px-5 py-3.5 text-center section-title">Score</th>
              <th className="px-5 py-3.5 text-center section-title">Issues</th>
              <th className="px-5 py-3.5 text-center section-title">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5">
                  <Link href={`/pages/${page.id}`} className="block">
                    <div className="font-body font-medium text-ink truncate max-w-sm group-hover:text-emerald-700 transition-colors">
                      {page.title || new URL(page.url).pathname || '/'}
                    </div>
                    <div className="text-xs font-body text-slate-600 truncate max-w-sm mt-0.5">{page.url}</div>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Link href={`/pages/${page.id}`}>
                    <span className={`font-display font-bold text-base ${scoreColor(page.pageScore)}`}>
                      {page.pageScore != null ? page.pageScore : '--'}
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-center font-body text-slate-700">
                  <Link href={`/pages/${page.id}`}>{page.issueCount}</Link>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={statusBadgeClass(page.status)}>
                    {page.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 && (
          <div className="p-8 text-center text-slate-600 text-sm font-body">No pages found.</div>
        )}
      </div>
    </div>
  );
}
