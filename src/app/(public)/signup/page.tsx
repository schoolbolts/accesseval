'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLANS = [
  {
    id: 'scan',
    label: 'Scan',
    price: '$99/yr',
    description: 'Monthly scans, up to 100 pages',
  },
  {
    id: 'comply',
    label: 'Comply',
    price: '$299/yr',
    description: 'Weekly scans, up to 500 pages, compliance docs',
  },
  {
    id: 'fix',
    label: 'Fix',
    price: '$599/yr',
    description: 'Weekly scans, up to 2,000 pages, CMS fix instructions',
  },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [plan, setPlan] = useState<'scan' | 'comply' | 'fix'>('scan');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, orgName, email, password, siteUrl, plan }),
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
            Create your account and start your accessibility compliance journey.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  Organization name
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

            <div>
              <label htmlFor="siteUrl" className="label">
                Website URL
              </label>
              <input
                id="siteUrl"
                type="url"
                required
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="input"
                placeholder="https://www.springfieldusd.org"
              />
            </div>

            <div>
              <p className="label">Choose a plan</p>
              <div className="space-y-2">
                {PLANS.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      plan === p.id
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={plan === p.id}
                      onChange={() => setPlan(p.id)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between">
                        <span className="font-body text-sm font-semibold text-ink">{p.label}</span>
                        <span
                          className={`font-body text-sm font-semibold ${
                            plan === p.id ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {p.price}
                        </span>
                      </span>
                      <span className="block font-body text-xs text-slate-500 mt-0.5">
                        {p.description}
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
                  Creating account…
                </>
              ) : (
                'Create account & go to checkout'
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
