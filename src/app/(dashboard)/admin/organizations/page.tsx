'use client';

import { useState, useEffect } from 'react';

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planStatus: string;
  stripeCustomerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  userCount: number;
  siteCount: number;
  sites: { url: string; cmsType: string; scanCount: number }[];
  utm: string | null;
  createdAt: string;
}

const planColors: Record<string, string> = {
  scan: 'bg-slate-100 text-slate-700',
  comply: 'bg-emerald-50 text-emerald-700',
  fix: 'bg-amber-50 text-amber-700',
};

const statusColors: Record<string, string> = {
  active: 'text-emerald-600',
  trialing: 'text-blue-600',
  past_due: 'text-amber-600',
  canceled: 'text-red-500',
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (planFilter) params.set('plan', planFilter);
    params.set('page', String(page));

    fetch(`/api/admin/organizations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrgs(data.organizations);
        setTotal(data.total);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [search, planFilter, page]);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search org name or email..."
          className="input max-w-xs"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="input max-w-[140px]"
        >
          <option value="">All plans</option>
          <option value="scan">Scan</option>
          <option value="comply">Comply</option>
          <option value="fix">Fix</option>
        </select>
        <span className="text-sm font-body text-slate-400 ml-auto">{total} organizations</span>
      </div>

      {loading ? (
        <p className="text-sm font-body text-slate-400">Loading...</p>
      ) : orgs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-body text-slate-400">No organizations found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Organization</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Owner</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Sites</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Users</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">UTM</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <>
                    <tr
                      key={org.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => setExpanded(expanded === org.id ? null : org.id)}
                    >
                      <td className="py-2.5 px-4 font-medium text-ink">{org.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px]">{org.ownerEmail || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${planColors[org.plan] || ''}`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-xs font-semibold capitalize ${statusColors[org.planStatus] || 'text-slate-600'}`}>
                        {org.planStatus}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{org.siteCount}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{org.userCount}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs truncate max-w-[120px]">{org.utm || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(org.createdAt).toLocaleDateString()}</td>
                    </tr>
                    {expanded === org.id && (
                      <tr key={`${org.id}-detail`} className="border-b border-slate-100">
                        <td colSpan={8} className="px-4 py-4 bg-surface">
                          <div className="grid grid-cols-2 gap-4 text-xs font-body">
                            <div>
                              <p className="text-slate-400 mb-1 font-semibold uppercase tracking-widest">Sites</p>
                              {org.sites.length === 0 ? (
                                <p className="text-slate-400">No sites</p>
                              ) : (
                                <ul className="space-y-1">
                                  {org.sites.map((s, i) => (
                                    <li key={i} className="text-slate-600">
                                      {s.url.replace(/^https?:\/\//, '')}
                                      <span className="text-slate-400 ml-2">({s.cmsType}, {s.scanCount} scans)</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1 font-semibold uppercase tracking-widest">Details</p>
                              <p className="text-slate-600">Slug: {org.slug}</p>
                              <p className="text-slate-600">Stripe: {org.stripeCustomerId || 'None'}</p>
                              <p className="text-slate-600">Owner: {org.ownerName || '—'} ({org.ownerEmail})</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-sm font-body text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
