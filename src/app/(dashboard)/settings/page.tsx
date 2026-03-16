'use client';

import { useState, useEffect } from 'react';

const CMS_OPTIONS = [
  { value: 'unknown', label: 'Not sure / Other' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'finalsite', label: 'Finalsite' },
  { value: 'squarespace', label: 'Squarespace' },
  { value: 'wix', label: 'Wix' },
  { value: 'civicplus', label: 'CivicPlus' },
  { value: 'google_sites', label: 'Google Sites' },
  { value: 'other', label: 'Other CMS' },
] as const;

interface SiteInfo {
  id: string;
  url: string;
  cmsType: string;
  maxPages: number;
}

export default function SettingsPage() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [savingCms, setSavingCms] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/invitations').then((r) => r.json()).then((data) => {
      setInvitations(data.invitations || []);
    });
    fetch('/api/sites').then((r) => r.json()).then((data) => {
      setSites(data.sites || []);
    });
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setInvitations((prev) => [data.invitation, ...prev]);
      setInviteEmail('');
    } else {
      alert(data.error);
    }
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/invitations/${id}`, { method: 'DELETE' });
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    const res = await fetch('/api/auth/billing-portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setBillingLoading(false);
  }

  async function updateCmsType(siteId: string, cmsType: string) {
    setSavingCms(siteId);
    try {
      const res = await fetch('/api/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, cmsType }),
      });
      if (res.ok) {
        setSites((prev) =>
          prev.map((s) => (s.id === siteId ? { ...s, cmsType } : s))
        );
      }
    } finally {
      setSavingCms(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your sites, billing, and team.</p>
      </div>

      {/* Sites card */}
      <div className="card p-6 mb-5 animate-fade-up">
        <h2 className="font-body font-semibold text-ink mb-1">Your websites</h2>
        <p className="text-sm font-body text-slate-600 mb-5">
          Set your CMS platform so we can generate platform-specific fix instructions.
        </p>

        {sites.length === 0 ? (
          <p className="text-sm font-body text-slate-600">No sites configured.</p>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between gap-4 px-4 py-3 bg-surface rounded-xl border border-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-body font-medium text-ink truncate">
                    {site.url.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="text-xs font-body text-slate-600">
                    Up to {site.maxPages.toLocaleString()} pages
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <select
                    value={site.cmsType}
                    onChange={(e) => updateCmsType(site.id, e.target.value)}
                    disabled={savingCms === site.id}
                    className="text-sm font-body bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {CMS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {savingCms === site.id && (
                    <span className="text-xs font-body text-slate-600">Saving...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing card */}
      <div className="card p-6 mb-5 animate-fade-up stagger-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-body font-semibold text-ink mb-1">Billing</h2>
            <p className="text-sm font-body text-slate-600">
              Manage your subscription, invoices, and payment method.
            </p>
          </div>
          <button
            onClick={openBillingPortal}
            disabled={billingLoading}
            className="btn-secondary shrink-0 ml-4"
          >
            {billingLoading ? 'Loading...' : 'Manage Billing'}
          </button>
        </div>
      </div>

      {/* Team card */}
      <div className="card p-6 animate-fade-up stagger-2">
        <h2 className="font-body font-semibold text-ink mb-1">Team Members</h2>
        <p className="text-sm font-body text-slate-600 mb-5">
          Invite colleagues to access this organization&apos;s dashboard.
        </p>

        <form onSubmit={handleInvite} className="flex gap-2 mb-5">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@school.org"
            className="input"
            required
          />
          <button type="submit" className="btn-primary shrink-0">
            Invite
          </button>
        </form>

        {invitations.length > 0 && (
          <div>
            <h3 className="section-title mb-3">Pending Invitations</h3>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between items-center px-4 py-2.5 bg-surface rounded-xl border border-slate-100"
                >
                  <span className="text-sm font-body text-ink">{inv.email}</span>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    className="btn-danger py-1 px-3 text-xs"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
