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
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Billing */}
      <div className="border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Billing</h2>
        <button
          onClick={openBillingPortal}
          disabled={billingLoading}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {billingLoading ? 'Loading...' : 'Manage Billing'}
        </button>
      </div>

      {/* Team */}
      <div className="border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Team Members</h2>

        <form onSubmit={handleInvite} className="flex gap-2 mb-4">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@school.org"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
            required
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Invite
          </button>
        </form>

        {invitations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Pending Invitations</h3>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{inv.email}</span>
                <button onClick={() => revokeInvite(inv.id)}
                  className="text-xs text-red-600 hover:underline">Revoke</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
