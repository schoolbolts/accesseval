import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PdfsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasPdfInventory = canUseFeature(plan, 'pdfInventory');

  if (!hasPdfInventory) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="page-title mb-8">PDF Inventory</h1>
        <div className="card p-8 text-center animate-fade-up">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="font-body font-semibold text-ink mb-2">PDF Inventory requires the Comply or Fix plan.</p>
          <p className="text-sm font-body text-slate-500">
            Upgrade your plan to see all PDFs found during scans and track which ones need review.
          </p>
        </div>
      </div>
    );
  }

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="page-title mb-1">PDF Inventory</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-500 text-sm">No site configured yet.</p>
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
      <div className="p-8 max-w-5xl">
        <h1 className="page-title mb-1">PDF Inventory</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-500 text-sm">No completed scans yet.</p>
        </div>
      </div>
    );
  }

  const pdfs = await prisma.pdfAsset.findMany({
    where: { scanId: latestScan.id },
    orderBy: { filename: 'asc' },
    select: {
      id: true,
      url: true,
      filename: true,
      sizeBytes: true,
      page: { select: { url: true, title: true } },
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">PDF Inventory</h1>
        <p className="page-subtitle">
          {pdfs.length} PDFs found in latest scan &mdash;{' '}
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
              <th className="px-5 py-3.5 text-left section-title">Filename</th>
              <th className="px-5 py-3.5 text-left section-title">Found on page</th>
              <th className="px-5 py-3.5 text-right section-title">Size</th>
              <th className="px-5 py-3.5 text-center section-title">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pdfs.map((pdf) => (
              <tr key={pdf.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-medium text-emerald-600 hover:text-emerald-700 hover:underline truncate block max-w-xs"
                  >
                    {pdf.filename}
                  </a>
                </td>
                <td className="px-5 py-3.5 font-body text-slate-500 truncate max-w-xs">
                  {pdf.page.title || pdf.page.url}
                </td>
                <td className="px-5 py-3.5 text-right font-body text-slate-600 font-mono text-xs">
                  {formatBytes(pdf.sizeBytes)}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className="badge-minor">Needs review</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pdfs.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm font-body">No PDFs found in this scan.</div>
        )}
      </div>
    </div>
  );
}
