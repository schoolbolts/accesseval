import { FreeScanForm } from '@/components/scan/free-scan-form';

export const metadata = {
  title: 'AccessEval — Free ADA Website Accessibility Scanner',
  description:
    'Scan your school or government website for ADA Title II compliance issues. Get a free accessibility report in minutes.',
};

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
            <span aria-hidden="true">⚠</span>
            ADA Title II deadline: April 24, 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Is your website ADA compliant?
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Free accessibility scan for K-12 schools and local governments. Find out where you stand
            before the deadline hits.
          </p>
          <div className="flex justify-center">
            <FreeScanForm />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No account required. Results in under 2 minutes.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600" aria-hidden="true">
                  1
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan</h3>
              <p className="text-gray-600">
                Enter your URL and we crawl your site using Playwright and axe-core, the industry
                standard for accessibility testing.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600" aria-hidden="true">
                  2
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Grade</h3>
              <p className="text-gray-600">
                Get a letter grade (A–F) and plain-English descriptions of every issue — no
                technical jargon.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600" aria-hidden="true">
                  3
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fix</h3>
              <p className="text-gray-600">
                Follow step-by-step fix instructions tailored to your CMS. Track progress and
                maintain compliance documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50" aria-labelledby="pricing-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="pricing-heading" className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, annual pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Everything you need to achieve and maintain ADA compliance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Scan tier */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Scan</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-gray-900">$99</span>
                <span className="text-gray-500">/yr</span>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Automated monthly scans and baseline compliance reporting.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  'Up to 100 pages',
                  'Monthly automated scans',
                  '2 on-demand scans/month',
                  'Letter grade + issue counts',
                  'WCAG 2.1 AA coverage',
                  'PDF reports',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=scan"
                className="block text-center px-4 py-2.5 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Comply tier */}
            <div className="bg-blue-600 rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Comply</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-white">$299</span>
                <span className="text-blue-200">/yr</span>
              </div>
              <p className="text-blue-100 text-sm mb-6">
                Weekly scans, fix tracking, and official compliance documentation.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  'Up to 500 pages',
                  'Weekly automated scans',
                  '5 on-demand scans/month',
                  'Fix tracking dashboard',
                  'Accessibility statement generator',
                  'Team member access',
                  'Email digest reports',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-blue-50">
                    <span className="text-white mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=comply"
                className="block text-center px-4 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Fix tier */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Fix</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-gray-900">$599</span>
                <span className="text-gray-500">/yr</span>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Unlimited scanning with CMS-specific fix instructions.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  'Up to 2,000 pages',
                  'Weekly automated scans',
                  'Unlimited on-demand scans',
                  'CMS-specific fix instructions',
                  'Shared reports for IT vendors',
                  'Priority email support',
                  'All Comply features',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=fix"
                className="block text-center px-4 py-2.5 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold text-white">AccessEval</p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AccessEval. Built for schools and governments.
          </p>
          <nav aria-label="Footer navigation" className="flex gap-4 text-sm">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="/contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
