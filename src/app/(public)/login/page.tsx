'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const linkError = searchParams.get('error');
  const linkErrorMsg =
    linkError === 'expired_link' ? 'That sign-in link has expired. Please request a new one.' :
    linkError === 'invalid_link' ? 'Invalid sign-in link.' :
    linkError === 'no_account' ? 'No account found for that email.' : null;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setMagicSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-display-md text-ink">Welcome back</h1>
          <p className="font-body text-slate-600 mt-2">Sign in to your AccessEval account.</p>
        </div>

        <div className="card p-8">
          {(linkErrorMsg || error) && (
            <div
              role="alert"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body mb-5"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {error || linkErrorMsg}
            </div>
          )}

          {/* Mode tabs */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 mb-6">
            <button
              onClick={() => { setMode('password'); setMagicSent(false); setError(''); }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${mode === 'password' ? 'bg-white text-ink shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}
            >
              Password
            </button>
            <button
              onClick={() => { setMode('magic'); setError(''); }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${mode === 'magic' ? 'bg-white text-ink shadow-sm' : 'text-slate-600 hover:text-slate-700'}`}
            >
              Email link
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label">Password</label>
                  <Link href="/forgot-password" className="text-xs text-emerald-700 hover:text-emerald-800 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? (
                  <>
                    <svg aria-hidden="true" className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          ) : magicSent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-700">
                  <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-body text-sm text-slate-600">
                Check your inbox for a sign-in link. It expires in 15 minutes.
              </p>
              <button onClick={() => setMagicSent(false)} className="text-emerald-700 hover:text-emerald-800 font-semibold text-sm">
                Send again
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicSubmit} className="space-y-5">
              <div>
                <label htmlFor="magic-email" className="label">Email</label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Sending…' : 'Send sign-in link'}
              </button>

              <p className="text-center font-body text-xs text-slate-600">
                We&apos;ll email you a link that signs you in instantly — no password needed.
              </p>
            </form>
          )}

          <p className="mt-6 text-center font-body text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-700 hover:text-emerald-800 font-semibold">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
