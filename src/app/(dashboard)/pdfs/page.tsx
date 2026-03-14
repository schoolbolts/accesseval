import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">PDF Inventory</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600 font-medium mb-2">PDF Inventory requires the Comply or Fix plan.</p>
          <p className="text-gray-400 text-sm">
            Upgrade your plan to see all PDFs found during scans and track which ones need review.
          </p>
        </div>
      </div>
    );
  }

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!site) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">PDF Inventory</h1>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">PDF Inventory</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No completed scans yet.</p>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PDF Inventory</h1>
        <p className="text-sm text-gray-500 mt-0.5">
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

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Filename
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Found on page
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-right">
                Size
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pdfs.map((pdf) => (
              <tr key={pdf.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium truncate block max-w-xs"
                  >
                    {pdf.filename}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                  {pdf.page.title || pdf.page.url}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatBytes(pdf.sizeBytes)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Needs review
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pdfs.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No PDFs found in this scan.</div>
        )}
      </div>
    </div>
  );
}
