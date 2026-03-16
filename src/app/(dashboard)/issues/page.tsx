import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveSite } from '@/lib/active-site';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';
import IssuesList from '@/components/issues/issues-list';

export default async function IssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasCmsFixInstructions = canUseFeature(plan, 'cmsFixInstructions');
  const hasAiSuggestions = canUseFeature(plan, 'aiFixSuggestions');

  const site = await getActiveSite(session.user.organizationId);

  if (!site) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="page-title mb-1">Issues</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600 text-sm">No site configured yet.</p>
        </div>
      </div>
    );
  }

  const latestScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { id: true, completedAt: true },
  });

  if (!latestScan) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="page-title mb-1">Issues</h1>
        <div className="card p-8 text-center mt-6">
          <p className="text-slate-600 text-sm">No completed scans yet.</p>
        </div>
      </div>
    );
  }

  const issues = await prisma.issue.findMany({
    where: { scanId: latestScan.id },
    orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
    take: 200,
    select: {
      id: true,
      axeRuleId: true,
      severity: true,
      description: true,
      fixInstructions: true,
      fixInstructionsCms: true,
      elementSelector: true,
      elementHtml: true,
      wcagCriteria: true,
      fingerprint: true,
      aiFixSuggestion: true,
      screenshotPath: true,
      page: { select: { url: true, title: true } },
    },
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">
            {issues.length} issues from latest scan &mdash;{' '}
            {latestScan.completedAt
              ? new Date(latestScan.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'unknown date'}
          </p>
        </div>
      </div>

      <IssuesList issues={issues} showCmsInstructions={hasCmsFixInstructions} showAiSuggestions={hasAiSuggestions} />
    </div>
  );
}
