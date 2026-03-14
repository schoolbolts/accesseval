'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    fetch('/api/invitations').then((r) => r.json()).then((data) => {
      setInvitations(data.invitations || []);
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

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, billing, and team.</p>
      </div>

      {/* Billing card */}
      <div className="card p-6 mb-5 animate-fade-up stagger-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-body font-semibold text-ink mb-1">Billing</h2>
            <p className="text-sm font-body text-slate-500">
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
        <p className="text-sm font-body text-slate-500 mb-5">
          Invite colleagues to access this organization's dashboard.
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
