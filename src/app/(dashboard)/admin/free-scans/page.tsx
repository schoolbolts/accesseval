'use client';

import { useState, useEffect } from 'react';

interface FreeScanItem {
  id: string;
  url: string;
  email: string | null;
  token: string;
  score: number | null;
  grade: string | null;
  issues: { critical: number; major: number; minor: number };
  converted: boolean;
  ipAddress: string;
  createdAt: string;
}

export default function AdminFreeScansPage() {
  const [scans, setScans] = useState<FreeScanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [emailOnly, setEmailOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (emailOnly) params.set('emailOnly', 'true');
    params.set('page', String(page));

    fetch(`/api/admin/free-scans?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setScans(data.freeScans);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [emailOnly, page]);

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <label className="flex items-center gap-1.5 text-sm font-body text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={emailOnly}
            onChange={(e) => { setEmailOnly(e.target.checked); setPage(1); }}
            className="accent-emerald-600"
          />
          With email only
        </label>
        <span className="text-sm font-body text-slate-600 ml-auto">{total} free scans</span>
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
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-widest">URL</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Email</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Converted</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Grade</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Score</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Issues</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">IP</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Date</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-ink truncate max-w-[200px]">{scan.url}</td>
                      <td className="py-2.5 px-3 text-slate-600">{scan.email || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        {scan.email ? (
                          scan.converted ? (
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">Yes</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">No</span>
                          )
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-display font-bold text-ink">{scan.grade || '—'}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{scan.score ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-red-500">{scan.issues.critical}</span>
                        {' / '}
                        <span className="text-amber-500">{scan.issues.major}</span>
                        {' / '}
                        <span className="text-slate-600">{scan.issues.minor}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs font-mono">{scan.ipAddress}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleDateString()}{' '}
                        {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <a
                          href={`/scan/${scan.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                        >
                          View
                        </a>
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
