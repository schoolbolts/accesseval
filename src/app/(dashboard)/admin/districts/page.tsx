'use client';

import { useState, useEffect } from 'react';

interface DistrictItem {
  id: string;
  ncesId: string;
  name: string;
  slug: string;
  website: string | null;
  city: string | null;
  stateCode: string | null;
  leaType: string | null;
  score: number | null;
  grade: string | null;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  lastScannedAt: string | null;
  screenshotUrl: string | null;
}

interface Summary {
  totalScanned: number;
  totalUnscanned: number;
  grades: Record<string, number>;
}

const gradeColors: Record<string, string> = {
  A: 'text-emerald-600',
  B: 'text-emerald-500',
  C: 'text-amber-500',
  D: 'text-orange-500',
  F: 'text-red-500',
};

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [state, setState] = useState('');
  const [scanned, setScanned] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (scanned) params.set('scanned', scanned);
    if (gradeFilter) params.set('grade', gradeFilter);
    params.set('page', String(page));

    fetch(`/api/admin/districts?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDistricts(data.districts);
        setTotal(data.total);
        setPages(data.pages);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [state, scanned, gradeFilter, page]);

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="card p-3 text-center">
            <p className="text-[10px] font-body font-semibold text-slate-600 uppercase tracking-widest">Scanned</p>
            <p className="text-lg font-display font-bold text-ink">{summary.totalScanned.toLocaleString()}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[10px] font-body font-semibold text-slate-600 uppercase tracking-widest">Unscanned</p>
            <p className="text-lg font-display font-bold text-slate-600">{summary.totalUnscanned.toLocaleString()}</p>
          </div>
          {['A', 'B', 'C', 'D', 'F'].map((g) => (
            <div key={g} className="card p-3 text-center">
              <p className="text-[10px] font-body font-semibold text-slate-600 uppercase tracking-widest">Grade {g}</p>
              <p className={`text-lg font-display font-bold ${gradeColors[g] || 'text-ink'}`}>
                {summary.grades[g]?.toLocaleString() || 0}
              </p>
            </div>
          ))}
          <div className="card p-3 text-center">
            <p className="text-[10px] font-body font-semibold text-slate-600 uppercase tracking-widest">Total</p>
            <p className="text-lg font-display font-bold text-ink">{total.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          value={state}
          onChange={(e) => { setState(e.target.value.toUpperCase().slice(0, 2)); setPage(1); }}
          placeholder="State (e.g. CA)"
          maxLength={2}
          className="input max-w-[100px]"
        />
        <select
          value={scanned}
          onChange={(e) => { setScanned(e.target.value); setPage(1); }}
          className="input max-w-[140px]"
        >
          <option value="">All</option>
          <option value="true">Scanned</option>
          <option value="false">Unscanned</option>
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
          className="input max-w-[120px]"
        >
          <option value="">All grades</option>
          {['A', 'B', 'C', 'D', 'F'].map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
        <span className="text-sm font-body text-slate-600 ml-auto">{total.toLocaleString()} districts</span>
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
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-widest">District</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Location</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Website</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Grade</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Score</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Issues</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Scanned</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-ink font-medium truncate max-w-[200px]">{d.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {d.city}{d.city && d.stateCode ? ', ' : ''}{d.stateCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px] text-xs">
                        {d.website ? (
                          <a href={d.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                            {d.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : '—'}
                      </td>
                      <td className={`py-2.5 px-3 text-center font-display font-bold ${d.grade ? gradeColors[d.grade] || 'text-ink' : 'text-slate-300'}`}>
                        {d.grade || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{d.score ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        {d.lastScannedAt ? (
                          <>
                            <span className="text-red-500">{d.criticalCount}</span>
                            {' / '}
                            <span className="text-amber-500">{d.majorCount}</span>
                            {' / '}
                            <span className="text-slate-600">{d.minorCount}</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs">
                        {d.lastScannedAt ? new Date(d.lastScannedAt).toLocaleDateString() : 'Not scanned'}
                      </td>
                      <td className="py-2.5 px-3">
                        <a
                          href={`/schools/${d.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
