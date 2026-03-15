'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';

const CMS_LABELS: Record<string, string> = {
  wordpress: 'WordPress',
  squarespace: 'Squarespace',
  wix: 'Wix',
  civicplus: 'CivicPlus',
  finalsite: 'Finalsite',
  google_sites: 'Google Sites',
  edlio: 'Edlio',
  blackboard: 'Blackboard Web Community Manager',
  thrillshare: 'Thrillshare (Apptegy)',
  drupal: 'Drupal',
  joomla: 'Joomla',
  foxbright: 'Foxbright',
  campussuite: 'Campus Suite',
  schoolpointe: 'SchoolPointe',
  granicus: 'Granicus',
  revize: 'Revize',
};

interface ScanIssue {
  severity: string;
  description: string;
  fixInstructions: string;
  fixInstructionsCms?: string | null;
  wcagCriteria?: string;
}

interface ScanResult {
  status: 'processing' | 'complete';
  url?: string;
  score?: number;
  grade?: string;
  criticalCount?: number;
  majorCount?: number;
  minorCount?: number;
  issues?: ScanIssue[];
  totalIssues?: number;
  hasEmail?: boolean;
  screenshotUrl?: string | null;
  narrative?: string | null;
  detectedCms?: string | null;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    critical: 'badge-critical',
    major: 'badge-major',
    minor: 'badge-minor',
  };
  return (
    <span className={cls[severity] ?? 'badge bg-slate-100 text-slate-700'}>
      {severity}
    </span>
  );
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
  const { ringColor, textColor, label } =
    score >= 90
      ? { ringColor: 'ring-emerald-400', textColor: 'text-emerald-500', label: 'Excellent' }
      : score >= 80
        ? { ringColor: 'ring-lime-400', textColor: 'text-lime-500', label: 'Good' }
        : score >= 70
          ? { ringColor: 'ring-amber-400', textColor: 'text-amber-500', label: 'Fair' }
          : score >= 60
            ? { ringColor: 'ring-orange-400', textColor: 'text-orange-500', label: 'Poor' }
            : { ringColor: 'ring-red-400', textColor: 'text-red-500', label: 'Critical' };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-32 h-32 rounded-full ring-4 ${ringColor} flex flex-col items-center justify-center`}
      >
        <span className={`font-display text-6xl font-extrabold leading-none ${textColor}`}>
          {grade}
        </span>
      </div>
      <div className="mt-4 text-center">
        <p className="font-display text-display-sm text-ink">{score}/100</p>
        <p className={`font-body text-sm font-medium mt-1 ${textColor}`}>{label}</p>
      </div>
    </div>
  );
}

function trackEvent(token: string, event: 'view' | 'email' | 'signup_click') {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, event }),
  }).catch(() => {});
}

export function ScanProgress({ token }: { token: string }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const viewTracked = useRef(false);

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
      if (data.status === 'complete' && !viewTracked.current) {
        viewTracked.current = true;
        trackEvent(token, 'view');
      }
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
      trackEvent(token, 'email');
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
        <div className="card-padded">
          <p className="font-body text-red-600 text-lg font-medium mb-4">{error}</p>
          <a href="/" className="btn-primary inline-flex">
            Start a new scan
          </a>
        </div>
      </div>
    );
  }

  if (!result || result.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div
          role="status"
          aria-label="Scanning your website"
          className="flex flex-col items-center gap-8"
        >
          {/* Animated spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>

          {/* Pulsing dots */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <div>
            <h1 className="font-display text-display-md text-ink mb-2">
              Scanning your website...
            </h1>
            <p className="font-body text-slate-500">
              We&apos;re running accessibility checks on your site. This usually takes 30–90
              seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { url: scannedUrl, score, grade, criticalCount, majorCount, minorCount, issues, totalIssues, hasEmail, screenshotUrl, narrative, detectedCms } =
    result;

  const hasUnlockedEmail = hasEmail || emailSubmitted;
  const remainingIssues = (totalIssues ?? 0) - (issues?.length ?? 0);
  const displayUrl = scannedUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="font-display text-display-md text-ink mb-1">
          Accessibility Scan Results
        </h1>
        {displayUrl ? (
          <a
            href={scannedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {displayUrl}
          </a>
        ) : (
          <p className="font-body text-slate-400 text-sm">Free single-page scan</p>
        )}
        {detectedCms && detectedCms !== 'unknown' && (
          <p className="font-body text-xs text-slate-400 mt-1">
            Detected CMS: <span className="font-medium text-slate-500">{CMS_LABELS[detectedCms] ?? detectedCms}</span>
            {' — fix instructions tailored to your platform'}
          </p>
        )}
      </div>

      {/* Grade + screenshot */}
      <div className="card p-8 mb-6 animate-scale-in">
        <div className={`flex ${screenshotUrl ? 'flex-col md:flex-row gap-8 items-center' : 'flex-col items-center'}`}>
          {/* Grade circle */}
          <div className="flex-shrink-0">
            {grade !== undefined && score !== undefined ? (
              <GradeCircle grade={grade} score={score} />
            ) : (
              <p className="font-body text-slate-500">No score available</p>
            )}
          </div>

          {/* Screenshot */}
          {screenshotUrl && (
            <div className="flex-1 min-w-0">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={screenshotUrl}
                  alt={`Screenshot of ${displayUrl || 'scanned website'}`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI narrative */}
      {narrative && (
        <div className="card p-6 mb-6 animate-fade-up">
          <p className="font-body text-slate-600 text-sm leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Issue count stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up stagger-1">
        <div className="stat-card border-l-4 border-l-red-400">
          <div className="stat-value text-red-500">{criticalCount ?? 0}</div>
          <div className="stat-label text-red-600">Critical</div>
        </div>
        <div className="stat-card border-l-4 border-l-orange-400">
          <div className="stat-value text-orange-500">{majorCount ?? 0}</div>
          <div className="stat-label text-orange-600">Major</div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400">
          <div className="stat-value text-amber-500">{minorCount ?? 0}</div>
          <div className="stat-label text-amber-600">Minor</div>
        </div>
      </div>

      {/* Top issues */}
      {issues && issues.length > 0 && (
        <div className="mb-6 animate-fade-up stagger-2">
          <h2 className="font-display text-display-sm text-ink mb-1">
            Top issues
          </h2>
          <p className="font-body text-sm text-slate-400 mb-4">
            Showing {issues.length} of {totalIssues}
          </p>
          <ul className="space-y-3">
            {issues.map((issue, i) => (
              <li key={i} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="font-body font-medium text-ink text-sm leading-snug">
                    {issue.description}
                  </p>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <p className="font-body text-sm text-slate-500">{issue.fixInstructions}</p>
                {issue.wcagCriteria && (
                  <p className="font-mono text-xs text-slate-400 mt-2">
                    WCAG: {issue.wcagCriteria}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Single unified CTA — changes based on whether we have their email */}
      {!hasUnlockedEmail && remainingIssues > 0 ? (
        /* Step 1: Email capture — the only ask on screen */
        <div className="relative bg-navy-800 bg-grid rounded-2xl p-8 text-center overflow-hidden animate-fade-up stagger-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'radial-gradient(ellipse at 50% 120%, rgba(5,150,105,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-display-sm text-white mb-2">
              Unlock your full report
            </h2>
            <p className="font-body text-slate-400 text-sm mb-6 max-w-md mx-auto">
              You&apos;re seeing {issues?.length ?? 0} of {totalIssues} issues found on this page.
              Enter your email to see them all — plus fix instructions for each one.
            </p>
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
            >
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
                  className="w-full rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500 font-body text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                />
                {emailError && (
                  <p role="alert" className="mt-1 font-body text-xs text-red-400">
                    {emailError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="btn-primary whitespace-nowrap"
              >
                {emailLoading ? (
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
                    Unlocking...
                  </>
                ) : (
                  'Send my report'
                )}
              </button>
            </form>
            <p className="font-body text-slate-500 text-xs mt-4">
              No spam. We&apos;ll send your full results and compliance tips.
            </p>
          </div>
        </div>
      ) : (
        /* Step 2: After email (or no gating needed) — upsell to full site scan */
        <div className="relative bg-navy-800 bg-grid rounded-2xl p-8 text-center overflow-hidden animate-fade-up stagger-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'radial-gradient(ellipse at 50% 120%, rgba(5,150,105,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-display-sm text-white mb-2">
              Ready to fix these issues?
            </h2>
            <p className="font-body text-slate-400 text-sm mb-6 max-w-md mx-auto">
              This was a single-page scan. A full AccessEval report scans every page on your site
              with step-by-step fix instructions, compliance documentation, and ongoing monitoring.
            </p>
            <a
              href="/signup"
              onClick={() => trackEvent(token, 'signup_click')}
              className="btn-primary-lg inline-flex"
            >
              Start your free trial
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
