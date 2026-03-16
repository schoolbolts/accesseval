'use client';

import { useState, useEffect } from 'react';

interface Stats {
  overview: {
    totalOrgs: number;
    activeOrgs: number;
    canceledOrgs: number;
    totalUsers: number;
    arr: number;
    churnRate: number;
  };
  funnel: {
    freeScansTotal: number;
    freeScansWeek: number;
    freeScansWithEmail: number;
    emailCaptureRate: number;
    signupsMonth: number;
    signupsWeek: number;
  };
  planDistribution: Record<string, number>;
  utmSources: { source: string; count: number }[];
  recentSignups: {
    name: string;
    email: string;
    plan: string;
    status: string;
    utm: string | null;
    date: string;
  }[];
  recentFreeScans: {
    url: string;
    email: string | null;
    grade: string | null;
    score: number | null;
    date: string;
  }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-body font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      {sub && <p className="text-xs font-body text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Not authorized' : 'Failed to load');
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 font-body text-slate-600">Loading...</div>;
  if (error) return <div className="p-8 font-body text-red-500">{error}</div>;
  if (!stats) return null;

  return (
    <div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="ARR" value={`$${stats.overview.arr.toLocaleString()}`} />
        <StatCard label="Active Orgs" value={stats.overview.activeOrgs} />
        <StatCard label="Total Users" value={stats.overview.totalUsers} />
        <StatCard label="Canceled" value={stats.overview.canceledOrgs} sub={`${stats.overview.churnRate}% churn`} />
        <StatCard label="Signups (7d)" value={stats.funnel.signupsWeek} />
        <StatCard label="Signups (30d)" value={stats.funnel.signupsMonth} />
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Free Scan Funnel</h2>
          <div className="space-y-3 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Free scans (all time)</span>
              <span className="font-semibold text-ink">{stats.funnel.freeScansTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Free scans (7d)</span>
              <span className="font-semibold text-ink">{stats.funnel.freeScansWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Emails captured</span>
              <span className="font-semibold text-ink">{stats.funnel.freeScansWithEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Email capture rate</span>
              <span className="font-semibold text-emerald-600">{stats.funnel.emailCaptureRate}%</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Plan Distribution</h2>
          <div className="space-y-3 font-body text-sm">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} className="flex justify-between">
                <span className="text-slate-600 capitalize">{plan}</span>
                <span className="font-semibold text-ink">{count}</span>
              </div>
            ))}
          </div>
          {stats.utmSources.length > 0 && (
            <>
              <h3 className="font-body font-semibold text-slate-400 text-xs uppercase tracking-widest mt-6 mb-3">
                Top UTM Sources
              </h3>
              <div className="space-y-2 font-body text-sm">
                {stats.utmSources.map((u) => (
                  <div key={u.source} className="flex justify-between">
                    <span className="text-slate-600">{u.source}</span>
                    <span className="font-semibold text-ink">{u.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Signups */}
      <div className="card p-6 mb-8">
        <h2 className="font-display font-semibold text-ink mb-4">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Org</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">UTM</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSignups.map((s, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2.5 px-3 text-ink">{s.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold capitalize">
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{s.utm || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Free Scans */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink mb-4">Recent Free Scans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">URL</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Grade</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Score</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentFreeScans.map((f, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2.5 px-3 text-ink truncate max-w-[200px]">{f.url}</td>
                  <td className="py-2.5 px-3 text-slate-600">{f.email || '—'}</td>
                  <td className="py-2.5 px-3 font-semibold">{f.grade || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{f.score ?? '—'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(f.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Keep the file marker so layout.tsx doesn't affect other pages

