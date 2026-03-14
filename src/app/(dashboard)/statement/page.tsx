import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';
import StatementForm from '@/components/statement/statement-form';

export default async function StatementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasFeature = canUseFeature(plan, 'accessibilityStatement');

  if (!hasFeature) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="page-title">Accessibility Statement</h1>
          <p className="page-subtitle">Generate a public-facing accessibility statement for your website.</p>
        </div>

        <div className="card p-10 text-center animate-fade-up stagger-1">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="font-display text-display-sm text-ink mb-2">Available on Comply</h2>
          <p className="font-body text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Accessibility statements show your community that you take web accessibility seriously.
            Upgrade to the Comply plan to generate a public-facing statement that stays up to date with your latest scan results.
          </p>
          <Link
            href="/settings"
            className="btn-primary inline-flex"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Accessibility Statement</h1>
        <p className="page-subtitle">Generate a public-facing accessibility statement for your website.</p>
      </div>
      <StatementForm />
    </div>
  );
}
