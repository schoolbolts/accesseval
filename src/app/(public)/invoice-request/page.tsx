'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvoiceRequestWrapper() {
  return (
    <Suspense>
      <InvoiceRequestPage />
    </Suspense>
  );
}

function InvoiceRequestPage() {
  const searchParams = useSearchParams();
  const [orgName, setOrgName] = useState('');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'comply' | 'fix'>(
    (searchParams.get('plan') as 'comply' | 'fix') || 'comply'
  );
  const [poNumber, setPoNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/invoices/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          billingContactName,
          billingContactEmail,
          billingAddress,
          siteUrl,
          password,
          plan,
          poNumber: poNumber || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(data.message);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-emerald-500">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="font-display text-display-sm text-ink mb-3">Invoice sent</h1>
            <p className="font-body text-slate-600 text-sm mb-6">{success}</p>
            <Link href="/login" className="btn-primary justify-center">
              Log in to your account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-display-md text-ink">Request a PO / Invoice</h1>
          <p className="font-body text-slate-600 mt-2">
            We&apos;ll send a NET-30 invoice to your billing contact. Your account activates once payment is received.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="siteUrl" className="label">Website URL</label>
              <input
                id="siteUrl"
                type="url"
                required
                autoFocus
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="input"
                placeholder="https://www.springfieldusd.org"
              />
            </div>

            <div>
              <label htmlFor="orgName" className="label">Organization name</label>
              <input
                id="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input"
                placeholder="Springfield Unified School District"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="billingContactName" className="label">Billing contact name</label>
                <input
                  id="billingContactName"
                  type="text"
                  required
                  value={billingContactName}
                  onChange={(e) => setBillingContactName(e.target.value)}
                  className="input"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="billingContactEmail" className="label">Billing contact email</label>
                <input
                  id="billingContactEmail"
                  type="email"
                  required
                  value={billingContactEmail}
                  onChange={(e) => setBillingContactEmail(e.target.value)}
                  className="input"
                  placeholder="jane@springfieldusd.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="billingAddress" className="label">Billing address</label>
              <textarea
                id="billingAddress"
                required
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="input"
                placeholder="123 Main St, Springfield, IL 62701"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <p className="label">Select plan</p>
              <div className="grid grid-cols-2 gap-3">
                {(['comply', 'fix'] as const).map((p) => (
                  <label
                    key={p}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all duration-150 text-center ${
                      plan === p
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p}
                      checked={plan === p}
                      onChange={() => setPlan(p)}
                      className="sr-only"
                    />
                    <span className="font-body text-sm font-semibold text-ink block">
                      {p === 'comply' ? 'Comply' : 'Fix'}
                    </span>
                    <span className={`font-display text-lg font-bold ${plan === p ? 'text-emerald-600' : 'text-ink'}`}>
                      {p === 'comply' ? '$299' : '$599'}
                    </span>
                    <span className="font-body text-xs text-slate-600 block">/year</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="poNumber" className="label">
                PO number <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                id="poNumber"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="input"
                placeholder="PO-2026-001234"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending invoice&hellip;
                </>
              ) : (
                'Request invoice'
              )}
            </button>

            <p className="text-center font-body text-xs text-slate-600">
              A NET-30 invoice will be emailed to the billing contact. Your account activates once payment is received.
            </p>
          </form>

          <p className="mt-6 text-center font-body text-sm text-slate-600">
            Prefer to pay by card?{' '}
            <Link href={`/signup?plan=${plan}`} className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign up with card payment
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
