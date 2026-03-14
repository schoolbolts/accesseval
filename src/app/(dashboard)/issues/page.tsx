import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';
import IssuesList from '@/components/issues/issues-list';

export default async function IssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const hasCmsFixInstructions = canUseFeature(plan, 'cmsFixInstructions');

  const site = await prisma.site.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  });

  if (!site) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Issues</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No site configured yet.</p>
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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Issues</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No completed scans yet.</p>
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
      page: { select: { url: true, title: true } },
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500 mt-0.5">
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

      <IssuesList issues={issues} showCmsInstructions={hasCmsFixInstructions} />
    </div>
  );
}
