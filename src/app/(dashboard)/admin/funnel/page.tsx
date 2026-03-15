'use client';

import { useState, useEffect } from 'react';

interface FunnelData {
  totals: { views: number; emails: number; signupClicks: number };
  rates: { emailRate: string; signupRate: string; overallRate: string };
  daily: Array<{ day: string; event: string; count: number }>;
  recent: Array<{ id: string; token: string; event: string; createdAt: string }>;
}

export default function AdminFunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/funnel?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return <p className="text-sm font-body text-slate-400">Loading funnel data...</p>;
  }

  const { totals, rates, recent } = data;

  // Build funnel bars
  const maxCount = Math.max(totals.views, 1);
  const steps = [
    { label: 'Page Views', count: totals.views, color: 'bg-emerald-500', pct: '100' },
    {
      label: 'Email Submitted',
      count: totals.emails,
      color: 'bg-amber-500',
      pct: rates.emailRate,
    },
    {
      label: 'Signup Clicked',
      count: totals.signupClicks,
      color: 'bg-red-500',
      pct: rates.overallRate,
    },
  ];

  const eventLabel: Record<string, string> = {
    view: 'View',
    email: 'Email',
    signup_click: 'Signup Click',
  };

  const eventColor: Record<string, string> = {
    view: 'bg-emerald-50 text-emerald-700',
    email: 'bg-amber-50 text-amber-700',
    signup_click: 'bg-red-50 text-red-700',
  };

  return (
    <div>
      {/* Time range picker */}
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors ${
              days === d
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Funnel visualization */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-display-sm text-ink mb-6">
          Free Scan Funnel
          <span className="font-body text-sm text-slate-400 font-normal ml-2">
            Last {days} days
          </span>
        </h2>

        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.label}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-body text-sm font-medium text-ink">{step.label}</span>
                <span className="font-body text-sm text-slate-500">
                  {step.count}{' '}
                  <span className="text-slate-400 text-xs">({step.pct}%)</span>
                </span>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-lg transition-all duration-500`}
                  style={{ width: `${Math.max((step.count / maxCount) * 100, step.count > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Conversion rates */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-emerald-600">
              {rates.emailRate}%
            </div>
            <div className="font-body text-xs text-slate-400 mt-1">View → Email</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-amber-600">
              {rates.signupRate}%
            </div>
            <div className="font-body text-xs text-slate-400 mt-1">Email → Signup</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-red-600">
              {rates.overallRate}%
            </div>
            <div className="font-body text-xs text-slate-400 mt-1">View → Signup</div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-display text-sm font-semibold text-ink">Recent Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Event
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Token
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                        eventColor[ev.event] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {eventLabel[ev.event] || ev.event}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">
                    <a
                      href={`/scan/${ev.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      {ev.token.slice(0, 20)}...
                    </a>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleDateString()}{' '}
                    {new Date(ev.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No funnel events yet. Events will appear as users view scan results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
