'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PLANS = [
  {
    id: 'scan',
    label: 'Scan',
    price: '$99',
    period: '/yr',
    tagline: 'Find out where you stand',
    features: ['1 website, up to 100 pages', 'Monthly automated scans', 'Letter grade + PDF reports'],
    popular: false,
  },
  {
    id: 'comply',
    label: 'Comply',
    price: '$299',
    period: '/yr',
    tagline: 'Stay compliant year-round',
    features: [
      'Up to 5 websites, 500 pages each',
      'Weekly scans + fix tracking',
      'Compliance docs + accessibility statement',
      'Team member access (3 seats)',
    ],
    popular: true,
  },
  {
    id: 'fix',
    label: 'Fix',
    price: '$599',
    period: '/yr',
    tagline: 'Full remediation support',
    features: [
      'Up to 10 websites, 2,000 pages each',
      'CMS-specific fix instructions',
      'Shareable reports for IT vendors',
      'Priority support + all Comply features',
    ],
    popular: false,
  },
] as const;

const COMPARE_ROWS = [
  { label: 'Websites', scan: '1', comply: 'Up to 5', fix: 'Up to 10' },
  { label: 'Pages per site', scan: '100', comply: '500', fix: '2,000' },
  { label: 'Scan frequency', scan: 'Monthly', comply: 'Weekly', fix: 'Weekly' },
  { label: 'On-demand scans', scan: '2/month', comply: '5/month', fix: 'Unlimited' },
  { label: 'Letter grade + issue counts', scan: true, comply: true, fix: true },
  { label: 'WCAG 2.2 AA coverage', scan: true, comply: true, fix: true },
  { label: 'PDF reports', scan: true, comply: true, fix: true },
  { label: 'Fix tracking dashboard', scan: false, comply: true, fix: true },
  { label: 'Accessibility statement generator', scan: false, comply: true, fix: true },
  { label: 'Team member access', scan: false, comply: true, fix: true },
  { label: 'Email digest reports', scan: false, comply: true, fix: true },
  { label: 'CMS-specific fix instructions', scan: false, comply: false, fix: true },
  { label: 'Shared reports for IT vendors', scan: false, comply: false, fix: true },
  { label: 'Priority email support', scan: false, comply: false, fix: true },
];

export default function SignupPageWrapper() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}

function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [plan, setPlan] = useState<'scan' | 'comply' | 'fix'>(
    (searchParams.get('plan') as 'scan' | 'comply' | 'fix') || 'comply'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, orgName, email, password, siteUrl, plan,
          utmSource: searchParams.get('utm_source') || undefined,
          utmMedium: searchParams.get('utm_medium') || undefined,
          utmCampaign: searchParams.get('utm_campaign') || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-display-md text-ink">Get started with AccessEval</h1>
          <p className="font-body text-slate-500 mt-2">
            Set up your account in under a minute. Payment is handled securely through Stripe.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Website URL — first, it's why they're here */}
            <div>
              <label htmlFor="siteUrl" className="label">
                Website URL
              </label>
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

            {/* 2. Email — low-friction, establishes identity */}
            <div>
              <label htmlFor="email" className="label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="jane@springfieldusd.org"
              />
            </div>

            {/* 3. Name + Org — personal details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="orgName" className="label">
                  Organization
                </label>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input"
                  placeholder="Springfield USD"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
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

            {/* 5. Plan selection — enriched cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="label mb-0">Choose a plan</p>
                <button
                  type="button"
                  onClick={() => setShowCompare(true)}
                  className="font-body text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
                >
                  Compare plans in detail
                </button>
              </div>
              <div className="space-y-2.5">
                {PLANS.map((p) => (
                  <label
                    key={p.id}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      plan === p.id
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={plan === p.id}
                        onChange={() => setPlan(p.id as 'scan' | 'comply' | 'fix')}
                        className="mt-1 accent-emerald-600"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="font-body text-sm font-semibold text-ink">{p.label}</span>
                            {p.popular && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                                Popular
                              </span>
                            )}
                          </span>
                          <span
                            className={`font-display text-base font-bold ${
                              plan === p.id ? 'text-emerald-600' : 'text-ink'
                            }`}
                          >
                            {p.price}<span className="font-body text-xs font-normal text-slate-500">{p.period}</span>
                          </span>
                        </span>
                        <span className="block font-body text-xs text-slate-500 mt-0.5 mb-2">
                          {p.tagline}
                        </span>
                        <span className="flex flex-wrap gap-x-3 gap-y-1">
                          {p.features.map((f) => (
                            <span key={f} className="flex items-center gap-1 font-body text-[11px] text-slate-500">
                              <svg
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`w-3 h-3 shrink-0 ${plan === p.id ? 'text-emerald-500' : 'text-slate-500'}`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {f}
                            </span>
                          ))}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body"
              >
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
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
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating account&hellip;
                </>
              ) : (
                'Continue to checkout'
              )}
            </button>

            <p className="text-center font-body text-xs text-slate-500">
              You&apos;ll complete payment on the next screen via Stripe. Cancel anytime.
            </p>
          </form>

          <p className="mt-6 text-center font-body text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Plan comparison modal */}
      {showCompare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCompare(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-display text-lg font-bold text-ink">Compare plans</h2>
              <button
                type="button"
                onClick={() => setShowCompare(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-600"
                aria-label="Close comparison"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <div className="overflow-auto max-h-[calc(85vh-4rem)]">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-medium text-slate-500 w-[40%]">Feature</th>
                    <th className="text-center py-3 px-3 font-semibold text-ink">
                      <div>Scan</div>
                      <div className="text-xs font-normal text-slate-500">$99/yr</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-emerald-600">
                      <div>Comply</div>
                      <div className="text-xs font-normal text-emerald-500">$299/yr</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-ink">
                      <div>Fix</div>
                      <div className="text-xs font-normal text-slate-500">$599/yr</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i < COMPARE_ROWS.length - 1 ? 'border-b border-slate-50' : ''}
                    >
                      <td className="py-2.5 px-4 text-slate-600">{row.label}</td>
                      {(['scan', 'comply', 'fix'] as const).map((tier) => (
                        <td key={tier} className="py-2.5 px-3 text-center">
                          {typeof row[tier] === 'boolean' ? (
                            row[tier] ? (
                              <svg
                                aria-label="Included"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 text-emerald-500 mx-auto"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="text-slate-300" aria-label="Not included">&mdash;</span>
                            )
                          ) : (
                            <span className="text-slate-700 font-medium">{row[tier]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="font-body text-xs text-slate-500">All plans include WCAG 2.2 AA scanning</p>
              <button
                type="button"
                onClick={() => setShowCompare(false)}
                className="font-body text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
