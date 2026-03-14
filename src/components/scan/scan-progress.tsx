'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';

interface ScanIssue {
  severity: string;
  description: string;
  fixInstructions: string;
  wcagCriteria?: string;
}

interface ScanResult {
  status: 'processing' | 'complete';
  score?: number;
  grade?: string;
  criticalCount?: number;
  majorCount?: number;
  minorCount?: number;
  issues?: ScanIssue[];
  totalIssues?: number;
  hasEmail?: boolean;
}

function SeverityBadge({ severity }: { severity: string }) {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    major: 'bg-orange-100 text-orange-800',
    minor: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
        classes[severity] ?? 'bg-gray-100 text-gray-800'
      }`}
    >
      {severity}
    </span>
  );
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
  const color =
    score >= 90
      ? 'text-green-600'
      : score >= 80
        ? 'text-lime-600'
        : score >= 70
          ? 'text-yellow-600'
          : score >= 60
            ? 'text-orange-600'
            : 'text-red-600';

  return (
    <div className={`text-center ${color}`}>
      <div className="text-8xl font-extrabold leading-none">{grade}</div>
      <div className="text-2xl font-semibold mt-1">{score}/100</div>
    </div>
  );
}

export function ScanProgress({ token }: { token: string }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const fetchResult = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/free/${token}`);
      if (res.status === 404) {
        setError('Scan not found.');
        return false;
      }
      if (res.status === 410) {
        setError('This scan link has expired.');
        return false;
      }
      const data: ScanResult = await res.json();
      setResult(data);
      return data.status === 'complete';
    } catch {
      setError('Failed to fetch scan results. Please refresh the page.');
      return false;
    }
  }, [token]);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      const done = await fetchResult();
      if (done || stopped) return;
      const id = setTimeout(poll, 2000);
      return () => clearTimeout(id);
    }

    poll();

    return () => {
      stopped = true;
    };
  }, [fetchResult]);

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);

    try {
      const res = await fetch(`/api/scan/free/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEmailError(data.error || 'Something went wrong.');
        setEmailLoading(false);
        return;
      }

      setEmailSubmitted(true);
      // Re-fetch to get 5 issues
      await fetchResult();
    } catch {
      setEmailError('Network error. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <p className="text-red-600 text-lg font-medium">{error}</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Start a new scan
        </a>
      </div>
    );
  }

  if (!result || result.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div
          role="status"
          aria-label="Scanning your website"
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Scanning your website...</h1>
            <p className="text-gray-600">
              We&apos;re running accessibility checks on your site. This usually takes 30–90
              seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { score, grade, criticalCount, majorCount, minorCount, issues, totalIssues, hasEmail } =
    result;

  const showEmailGate = !hasEmail && !emailSubmitted && (totalIssues ?? 0) > 3;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
        Accessibility Scan Results
      </h1>
      <p className="text-center text-gray-500 mb-10">Free single-page scan</p>

      {/* Grade + score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 text-center">
        {grade !== undefined && score !== undefined ? (
          <GradeCircle grade={grade} score={score} />
        ) : (
          <p className="text-gray-500">No score available</p>
        )}
      </div>

      {/* Issue count cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{criticalCount ?? 0}</div>
          <div className="text-sm font-medium text-red-800 mt-1">Critical</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{majorCount ?? 0}</div>
          <div className="text-sm font-medium text-orange-800 mt-1">Major</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{minorCount ?? 0}</div>
          <div className="text-sm font-medium text-yellow-800 mt-1">Minor</div>
        </div>
      </div>

      {/* Top issues */}
      {issues && issues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Top issues{' '}
            <span className="text-sm font-normal text-gray-500">
              (showing {issues.length} of {totalIssues})
            </span>
          </h2>
          <ul className="space-y-3">
            {issues.map((issue, i) => (
              <li key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="font-medium text-gray-900 text-sm">{issue.description}</p>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <p className="text-sm text-gray-600">{issue.fixInstructions}</p>
                {issue.wcagCriteria && (
                  <p className="text-xs text-gray-400 mt-2">WCAG: {issue.wcagCriteria}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Email gate */}
      {showEmailGate && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            See {(totalIssues ?? 0) - 3} more issue{(totalIssues ?? 0) - 3 !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Enter your email to unlock all issues from this scan.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1">
              <label htmlFor="gate-email" className="sr-only">
                Email address
              </label>
              <input
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourschool.edu"
                required
                disabled={emailLoading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              {emailError && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={emailLoading}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {emailLoading ? 'Unlocking...' : 'Unlock issues'}
            </button>
          </form>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Get your full site report</h2>
        <p className="text-gray-400 text-sm mb-6">
          This was a single-page scan. A full report covers every page of your site with fix
          instructions, compliance documentation, and ongoing monitoring.
        </p>
        <a
          href="/signup"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
        >
          Start your free trial
        </a>
      </div>
    </div>
  );
}
