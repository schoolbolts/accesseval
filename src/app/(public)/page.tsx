import type { Metadata } from 'next';
import { FreeScanForm } from '@/components/scan/free-scan-form';

export const metadata: Metadata = {
  title: 'Free ADA Website Accessibility Scanner for Schools & Governments',
  description: 'Check your school or government website for ADA Title II compliance issues in minutes. Free accessibility scan with plain-English fix instructions. No signup required.',
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AccessEval',
            applicationCategory: 'WebApplication',
            operatingSystem: 'Web',
            description: 'ADA website accessibility scanner for schools and governments. Checks WCAG 2.1 AA compliance.',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: '0',
              highPrice: '599',
              offerCount: '4',
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="relative bg-navy-800 bg-grid grain overflow-hidden py-24 px-4">
        {/* Decorative gradient orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, #059669 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Deadline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-body font-medium mb-8 animate-fade-in">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            ADA Title II deadlines: April 2026 &amp; April 2027
          </div>

          <h1 className="font-display text-display-xl text-white mb-6 animate-fade-up stagger-1 text-balance">
            Is your website ADA compliant?
          </h1>

          <p className="font-body text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            Free accessibility scan for school districts, cities, and counties. Find out where you
            stand before the deadline hits.
          </p>

          <div className="flex justify-center animate-fade-up stagger-3">
            <FreeScanForm />
          </div>

          <p className="mt-5 font-body text-sm text-slate-400 animate-fade-up stagger-4">
            No account required. Results in under 2 minutes.
          </p>
        </div>
      </section>

      {/* Why compliance matters */}
      <section className="py-24 px-4 bg-white" aria-labelledby="why-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-title mb-3">The law changed</p>
            <h2
              id="why-heading"
              className="font-display text-display-md text-ink mb-4"
            >
              ADA Title II now covers your website
            </h2>
            <p className="font-body text-slate-500 max-w-2xl mx-auto leading-relaxed">
              In April 2024, the DOJ finalized new rules requiring all state and local government
              websites to meet WCAG 2.1 AA standards. Entities serving 50,000+ people must comply
              by <strong className="text-ink">April 24, 2026</strong>. Smaller entities and special
              districts have until <strong className="text-ink">April 26, 2027</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="card-padded text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-red-500">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-display text-display-sm text-ink mb-2">Real legal exposure</h3>
              <p className="font-body text-slate-500 text-sm leading-relaxed">
                ADA lawsuits against schools and municipalities are surging. Settlements
                routinely cost $50K-$300K — not including remediation.
              </p>
            </div>

            <div className="card-padded text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-amber-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-display text-display-sm text-ink mb-2">Hard deadline</h3>
              <p className="font-body text-slate-500 text-sm leading-relaxed">
                Populations of 50,000+ must comply by April 24, 2026. Under 50,000 and special
                districts have until April 26, 2027. After that, non-compliance is a federal civil rights violation.
              </p>
            </div>

            <div className="card-padded text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-emerald-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-display text-display-sm text-ink mb-2">Affordable fix</h3>
              <p className="font-body text-slate-500 text-sm leading-relaxed">
                Most districts and towns can reach compliance for under $599/year.
                That&apos;s less than a single hour of ADA consulting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-surface bg-dot-pattern" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-title mb-3">Simple process</p>
            <h2
              id="how-it-works-heading"
              className="font-display text-display-md text-ink"
            >
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Scan',
                description:
                  'Enter your URL and we crawl your site using Playwright and axe-core, the industry standard for accessibility testing.',
              },
              {
                step: '02',
                title: 'Grade',
                description:
                  'Get a letter grade (A–F) and plain-English descriptions of every issue — no technical jargon.',
              },
              {
                step: '03',
                title: 'Fix',
                description:
                  'Follow step-by-step fix instructions tailored to your CMS. Track progress and maintain compliance documentation.',
              },
            ].map(({ step, title, description }, i) => (
              <div
                key={step}
                className={`card-padded text-center animate-fade-up stagger-${i + 1}`}
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span
                    className="font-display text-lg font-bold text-emerald-600"
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                </div>
                <h3 className="font-display text-display-sm text-ink mb-2">{title}</h3>
                <p className="font-body text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-24 px-4 bg-white" aria-labelledby="preview-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-title mb-3">See what you get</p>
            <h2
              id="preview-heading"
              className="font-display text-display-md text-ink mb-4"
            >
              Plain-English reports, not consultant jargon
            </h2>
            <p className="font-body text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Every scan produces a letter grade and a prioritized list of issues with
              step-by-step fix instructions anyone on your team can follow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-body text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Compliance Dashboard
              </p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                <img
                  src="/screenshots/dashboard.png"
                  alt="AccessEval dashboard showing site grade, score history chart, and top accessibility issues"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Site Report Card
              </p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                <img
                  src="/screenshots/report.png"
                  alt="AccessEval report card showing letter grade D, 38/100 score, and plain-English issue descriptions"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        className="py-24 px-4 bg-surface bg-dot-pattern"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-title mb-3">Transparent pricing</p>
            <h2
              id="pricing-heading"
              className="font-display text-display-md text-ink mb-3"
            >
              Simple, annual pricing
            </h2>
            <p className="font-body text-slate-500 max-w-md mx-auto">
              Everything you need to achieve and maintain ADA compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
            {/* Scan tier */}
            <div className="card p-8 flex flex-col">
              <h3 className="font-display text-display-sm text-ink mb-1">Scan</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$99</span>
                <span className="font-body text-slate-400 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-500 text-sm mb-6">
                Automated monthly scans and baseline compliance reporting.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  '1 website, up to 100 pages',
                  'Monthly automated scans',
                  '2 on-demand scans/month',
                  'Letter grade + issue counts',
                  'WCAG 2.1 AA coverage',
                  'PDF reports',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=scan"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-body font-semibold text-sm text-emerald-700 border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Comply tier — highlighted */}
            <div className="card p-8 flex flex-col ring-2 ring-emerald-500 shadow-glow relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="badge-success px-3 py-1 text-xs font-semibold">
                  Most popular
                </span>
              </div>
              <h3 className="font-display text-display-sm text-ink mb-1">Comply</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$299</span>
                <span className="font-body text-slate-400 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-500 text-sm mb-6">
                Weekly scans, fix tracking, and official compliance documentation.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  'Up to 5 websites, 500 pages each',
                  'Weekly automated scans',
                  '5 on-demand scans/month',
                  'Fix tracking dashboard',
                  'Accessibility statement generator',
                  'Team access (3 seats)',
                  'Email digest reports',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/signup?plan=comply" className="btn-primary justify-center">
                Get started
              </a>
            </div>

            {/* Fix tier */}
            <div className="card p-8 flex flex-col">
              <h3 className="font-display text-display-sm text-ink mb-1">Fix</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$599</span>
                <span className="font-body text-slate-400 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-500 text-sm mb-6">
                Unlimited scanning with CMS-specific fix instructions.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  'Up to 10 websites, 2,000 pages each',
                  'Weekly automated scans',
                  'Unlimited on-demand scans',
                  'CMS-specific fix instructions',
                  'Shared reports for IT vendors',
                  'Priority support + 10 team seats',
                  'All Comply features',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=fix"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-body font-semibold text-sm text-emerald-700 border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-navy-300 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div>
              <p className="font-display font-bold text-xl text-white mb-3">AccessEval</p>
              <p className="font-body text-sm text-navy-400 leading-relaxed">
                ADA compliance for school districts, cities, and counties.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="font-body text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">
                Product
              </p>
              <nav aria-label="Product links" className="flex flex-col gap-2.5">
                {[
                  { href: '/#how-it-works', label: 'How it works' },
                  { href: '/#pricing', label: 'Pricing' },
                  { href: '/schools', label: 'Reports' },
                  { href: '/signup', label: 'Get started' },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="font-body text-sm text-navy-300 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Resources */}
            <div>
              <p className="font-body text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">
                Resources
              </p>
              <nav aria-label="Resource links" className="flex flex-col gap-2.5">
                {[
                  { href: '/blog', label: 'Blog' },
                  { href: '/scan', label: 'Free scan' },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="font-body text-sm text-navy-300 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="border-t border-navy-700 pt-8">
            <p className="font-body text-sm text-navy-500 text-center">
              &copy; {new Date().getFullYear()} AccessEval
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
