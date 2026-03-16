import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

/* ── Grade color helpers ──────────────────────────────────────────── */

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-600';
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

function gradeRingColor(grade: string | null) {
  if (!grade) return 'ring-slate-200';
  if (grade.startsWith('A')) return 'ring-emerald-400';
  if (grade.startsWith('B')) return 'ring-blue-400';
  if (grade.startsWith('C')) return 'ring-amber-400';
  if (grade.startsWith('D')) return 'ring-orange-400';
  return 'ring-red-400';
}

function severityBadgeClass(severity: string) {
  if (severity === 'critical') return 'badge-critical';
  if (severity === 'major') return 'badge-major';
  return 'badge-minor';
}

/* ── SEO metadata ─────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const district = await prisma.district.findUnique({ where: { slug } });

  if (!district) return { title: 'District Not Found' };

  const location = [district.city, district.stateCode].filter(Boolean).join(', ');

  if (!district.score) {
    return {
      title: `${district.name} Website Accessibility Report — ${location}`,
      description: `Check the accessibility compliance status of ${district.name} in ${location}. Free ADA Title II website accessibility scan for school districts.`,
    };
  }

  return {
    title: `${district.name} Accessibility Score: ${district.grade} (${district.score}/100) — ${location}`,
    description: `${district.name} in ${location} scored ${district.score}/100 (${district.grade}) on our ADA website accessibility scan. ${district.criticalCount} critical, ${district.majorCount} major, ${district.minorCount} minor issues found.`,
    openGraph: {
      title: `${district.name} — Website Accessibility Score: ${district.grade}`,
      description: `Scored ${district.score}/100 on WCAG 2.2 AA compliance scan.`,
    },
  };
}

/* ── Issue parsing ────────────────────────────────────────────────── */

interface ScanIssue {
  axeRuleId?: string;
  severity?: string;
  description?: string;
  fixInstructions?: string;
  wcagCriteria?: string;
}

function parseIssues(json: unknown): ScanIssue[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as ScanIssue[];
  if (typeof json === 'object' && json !== null && 'issues' in json) {
    return (json as { issues: ScanIssue[] }).issues ?? [];
  }
  return [];
}

/* ── Page component ───────────────────────────────────────────────── */

export default async function SchoolReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const district = await prisma.district.findUnique({ where: { slug } });

  if (!district) notFound();

  const location = [district.city, district.stateCode].filter(Boolean).join(', ');
  const hasResults = district.score !== null;

  /* ---------- Not yet scanned ---------- */
  if (!hasResults) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        <h1 className="font-display text-display-md text-ink mb-2">{district.name}</h1>
        <p className="font-body text-slate-600 mb-1">{location}</p>
        {district.website && (
          <p className="font-body text-sm text-slate-600 mb-6">{district.website}</p>
        )}
        <p className="font-body text-slate-600 max-w-md mx-auto mb-8">
          We haven&apos;t scanned this district&apos;s website yet. Run a free accessibility scan to see
          how it measures up against WCAG 2.2 AA and ADA Title II requirements.
        </p>
        <Link href="/" className="btn-primary">
          Run a Free Scan
        </Link>

        {/* SEO content */}
        <div className="mt-16 text-left max-w-xl mx-auto">
          <h2 className="font-display text-display-sm text-ink mb-3">
            About {district.name}
          </h2>
          <div className="font-body text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              {district.name} is a {district.leaType?.toLowerCase() || 'school district'} located
              in {location}. Under <strong>ADA Title II</strong>, public school districts are
              required to make their websites accessible to people with disabilities.
            </p>
            <p>
              The U.S. Department of Justice has set compliance deadlines for website accessibility.
              Schools must meet WCAG 2.2 Level AA standards to ensure students, parents, and
              community members with disabilities can access important information online.
            </p>
            {district.website && (
              <p>
                The district website at{' '}
                <a href={district.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  {district.website.replace(/^https?:\/\//, '')}
                </a>{' '}
                can be scanned for free using AccessEval to identify accessibility barriers.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Has scan results ---------- */
  const issues = parseIssues(district.scanResultsJson);
  const scannedDate = district.lastScannedAt?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      {/* Header: grade + district info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 animate-fade-up">
        <div className={`w-28 h-28 shrink-0 rounded-full ring-[5px] ${gradeRingColor(district.grade)} flex items-center justify-center`}>
          <span className={`font-display text-5xl font-extrabold leading-none ${gradeColor(district.grade)}`}>
            {district.grade ?? '--'}
          </span>
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-display text-display-md text-ink mb-1">{district.name}</h1>
          <p className="font-body text-sm text-slate-600">{location}</p>
          <p className="font-body text-slate-600 mt-1">
            Accessibility Score:{' '}
            <span className="font-semibold text-ink">{district.score}/100</span>
          </p>
          {scannedDate && (
            <p className="font-body text-sm text-slate-600 mt-1">Scanned {scannedDate}</p>
          )}
        </div>
      </div>

      {/* Screenshot */}
      {district.screenshotUrl && (
        <div className="mb-10 animate-fade-up stagger-1">
          <div className="card overflow-hidden">
            <img
              src={district.screenshotUrl}
              alt={`Screenshot of ${district.name} website`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="stat-card border-l-4 border-l-red-400 animate-fade-up stagger-1">
          <div className="stat-value text-red-500">{district.criticalCount}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card border-l-4 border-l-orange-400 animate-fade-up stagger-2">
          <div className="stat-value text-orange-500">{district.majorCount}</div>
          <div className="stat-label">Major</div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400 animate-fade-up stagger-3">
          <div className="stat-value text-amber-500">{district.minorCount}</div>
          <div className="stat-label">Minor</div>
        </div>
      </div>

      {/* Issues found */}
      {issues.length > 0 && (
        <section className="mb-10 animate-fade-up stagger-4">
          <h2 className="font-display text-display-sm text-ink mb-4">What We Found</h2>
          <div className="space-y-3">
            {issues.slice(0, 5).map((issue, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={severityBadgeClass(issue.severity || 'minor')}>
                    {issue.severity || 'minor'}
                  </span>
                  {issue.axeRuleId && (
                    <span className="font-mono text-xs text-slate-600">{issue.axeRuleId}</span>
                  )}
                  {issue.wcagCriteria && (
                    <span className="text-xs font-body text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5">
                      WCAG {issue.wcagCriteria}
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-ink">
                  {issue.description || 'Accessibility issue detected'}
                </p>
              </div>
            ))}
          </div>
          {issues.length > 5 && (
            <p className="font-body text-sm text-slate-600 mt-3 text-center">
              + {issues.length - 5} more issues.{' '}
              <Link href="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign up for the full report
              </Link>
            </p>
          )}
        </section>
      )}

      {/* CTA */}
      <section className="card p-8 text-center mb-10 bg-emerald-50/50 animate-fade-up stagger-5">
        <h2 className="font-display text-display-sm text-ink mb-2">Want the full report?</h2>
        <p className="font-body text-slate-600 text-sm max-w-md mx-auto mb-6">
          Sign up for AccessEval to get detailed fix instructions for every issue, ongoing
          monitoring, and ADA compliance documentation for {district.name}.
        </p>
        <Link href="/signup" className="btn-primary">
          Get Started &rarr;
        </Link>
      </section>

      {/* About section (SEO content) */}
      <section className="animate-fade-up stagger-6">
        <h2 className="font-display text-display-sm text-ink mb-3">About This Report</h2>
        <div className="font-body text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            This is an automated accessibility scan of the {district.name} website using WCAG 2.2
            Level AA standards, powered by{' '}
            <a href="https://www.deque.com/axe/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
              axe-core
            </a>
            , the industry-standard accessibility testing engine.
          </p>
          <p>
            Under <strong>ADA Title II</strong>, public school districts like {district.name} in{' '}
            {district.state || location} are required to ensure their websites are accessible to
            people with disabilities. The U.S. Department of Justice has set compliance deadlines of
            April 24, 2026 for entities serving 50,000+ people and April 26, 2027 for smaller
            entities. Automated scanning catches approximately 30–40% of potential issues; a complete
            assessment may include manual testing.
          </p>
        </div>
      </section>
    </div>
  );
}
