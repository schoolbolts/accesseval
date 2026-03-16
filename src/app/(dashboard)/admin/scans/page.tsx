'use client';

import { useState, useEffect } from 'react';

interface ScanItem {
  id: string;
  status: string;
  triggeredBy: string;
  pagesFound: number;
  pagesScanned: number;
  score: number | null;
  grade: string | null;
  issues: { critical: number; major: number; minor: number };
  errorMessage: string | null;
  siteUrl: string;
  orgName: string;
  orgPlan: string;
  createdAt: string;
  completedAt: string | null;
  duration: number | null;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-600',
  queued: 'bg-slate-100 text-slate-600',
  crawling: 'bg-blue-50 text-blue-600',
  scanning: 'bg-blue-50 text-blue-600',
};

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));

    fetch(`/api/admin/scans?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setScans(data.scans);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input max-w-[160px]"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
          <option value="crawling">Crawling</option>
          <option value="scanning">Scanning</option>
        </select>
        <span className="text-sm font-body text-slate-600 ml-auto">{total} scans</span>
      </div>

      {loading ? (
        <p className="text-sm font-body text-slate-600">Loading...</p>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-widest">Site</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Org</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Status</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Trigger</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Grade</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Score</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Pages</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Issues</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Duration</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-ink truncate max-w-[180px]">
                        {scan.siteUrl.replace(/^https?:\/\//, '')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">{scan.orgName}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${statusColors[scan.status] || 'bg-slate-100 text-slate-600'}`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs capitalize">{scan.triggeredBy}</td>
                      <td className="py-2.5 px-3 text-center font-display font-bold text-ink">{scan.grade || '—'}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{scan.score ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{scan.pagesScanned}/{scan.pagesFound}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-red-500">{scan.issues.critical}</span>
                        {' / '}
                        <span className="text-amber-500">{scan.issues.major}</span>
                        {' / '}
                        <span className="text-slate-600">{scan.issues.minor}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 text-xs">
                        {scan.duration ? `${scan.duration}s` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleDateString()}{' '}
                        {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">Prev</button>
              <span className="text-sm font-body text-slate-600">Page {page} of {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
