import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mapScoreToGrade } from '@/lib/scoring';
import { canUseFeature } from '@/lib/plan-limits';
import type { PlanName } from '@/lib/plan-limits';

type IssueSeverity = 'critical' | 'major' | 'minor';

function severityBadge(severity: string) {
  if (severity === 'critical') return 'badge-critical';
  if (severity === 'major') return 'badge-major';
  return 'badge-minor';
}

function scoreColor(score: number | null) {
  if (score == null) return 'text-slate-600';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function gradeRingColor(grade: string) {
  if (grade.startsWith('A')) return 'ring-emerald-400';
  if (grade.startsWith('B')) return 'ring-blue-400';
  if (grade.startsWith('C')) return 'ring-amber-400';
  if (grade.startsWith('D')) return 'ring-orange-400';
  return 'ring-red-400';
}

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

interface PageDetailProps {
  params: Promise<{ pageId: string }>;
}

export default async function PageDetailPage({ params }: PageDetailProps) {
  const { pageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const plan = session.user.plan as PlanName;
  const showCms = canUseFeature(plan, 'cmsFixInstructions');
  const showAiSuggestions = canUseFeature(plan, 'aiFixSuggestions');

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      scan: {
        select: { siteId: true, site: { select: { organizationId: true } } },
      },
    },
  });

  if (!page || page.scan.site.organizationId !== session.user.organizationId) {
    notFound();
  }

  const issues = await prisma.issue.findMany({
    where: { pageId },
    orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
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
      aiFixSuggestion: true,
      screenshotPath: true,
    },
  });

  // Group issues by axeRuleId for a cleaner display
  const grouped = new Map<string, {
    severity: string;
    description: string;
    wcagCriteria: string | null;
    instances: typeof issues;
  }>();

  for (const issue of issues) {
    const key = issue.axeRuleId ?? issue.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        severity: issue.severity,
        description: issue.description,
        wcagCriteria: issue.wcagCriteria,
        instances: [],
      });
    }
    grouped.get(key)!.instances.push(issue);
  }

  const groups = Array.from(grouped.entries()).sort((a, b) => {
    const order: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    return (order[a[1].severity] ?? 3) - (order[b[1].severity] ?? 3);
  });

  const score = page.pageScore ?? 0;
  const grade = mapScoreToGrade(score);

  const counts = { critical: 0, major: 0, minor: 0 };
  for (const issue of issues) {
    const sev = issue.severity as IssueSeverity;
    if (sev in counts) counts[sev]++;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back link */}
      <div className="mb-6 animate-fade-up">
        <Link
          href="/pages"
          className="text-sm font-body text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to Pages
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-start gap-6 mb-8 animate-fade-up stagger-1">
        <div className={`w-20 h-20 rounded-2xl ring-[4px] ${gradeRingColor(grade)} flex items-center justify-center shrink-0`}>
          <span className={`font-display text-3xl font-extrabold leading-none ${gradeColor(grade)}`}>
            {grade}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="page-title truncate">{page.title || new URL(page.url).pathname || '/'}</h1>
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-body text-slate-600 hover:text-emerald-600 transition-colors truncate block mt-1"
          >
            {page.url}
          </a>
          <div className="flex items-center gap-4 mt-3">
            <span className={`font-display font-bold text-lg ${scoreColor(page.pageScore)}`}>
              {score}/100
            </span>
            <span className="text-sm font-body text-slate-600">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} across {groups.length} type{groups.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Issue count pills */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up stagger-2">
        <div className="card-padded text-center">
          <div className="text-xl font-display font-bold text-red-500">{counts.critical}</div>
          <div className="text-xs font-body text-slate-600 mt-0.5">Critical</div>
        </div>
        <div className="card-padded text-center">
          <div className="text-xl font-display font-bold text-orange-500">{counts.major}</div>
          <div className="text-xs font-body text-slate-600 mt-0.5">Major</div>
        </div>
        <div className="card-padded text-center">
          <div className="text-xl font-display font-bold text-amber-500">{counts.minor}</div>
          <div className="text-xs font-body text-slate-600 mt-0.5">Minor</div>
        </div>
      </div>

      {/* Grouped issues */}
      {groups.length === 0 ? (
        <div className="card p-10 text-center animate-fade-up stagger-3">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-emerald-600">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-body text-slate-600">No accessibility issues found on this page.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up stagger-3">
          {groups.map(([ruleId, group]) => (
            <div key={ruleId} className="card overflow-hidden">
              {/* Group header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <span className={`${severityBadge(group.severity)} shrink-0 mt-0.5`}>
                    {group.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-ink leading-snug">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-mono text-slate-600">{ruleId}</span>
                      {group.wcagCriteria && (
                        <span className="text-xs font-body text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5">
                          WCAG {group.wcagCriteria}
                        </span>
                      )}
                      <span className="text-xs font-body text-slate-600">
                        {group.instances.length} instance{group.instances.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instances */}
              <div className="divide-y divide-slate-50">
                {group.instances.map((issue, idx) => (
                  <div key={issue.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    {/* Fix instructions (show once on first instance) */}
                    {idx === 0 && issue.fixInstructions && (
                      <div className="mb-4">
                        <h4 className="text-xs font-body font-medium text-slate-600 uppercase tracking-wider mb-1.5">How to fix</h4>
                        <p className="text-sm font-body text-slate-700 leading-relaxed">{issue.fixInstructions}</p>
                      </div>
                    )}
                    {idx === 0 && showCms && issue.fixInstructionsCms && (
                      <div className="mb-4">
                        <h4 className="text-xs font-body font-medium text-slate-600 uppercase tracking-wider mb-1.5">CMS instructions</h4>
                        <p className="text-sm font-body text-slate-700 leading-relaxed">{issue.fixInstructionsCms}</p>
                      </div>
                    )}
                    {idx === 0 && showAiSuggestions && issue.aiFixSuggestion && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl px-4 py-3 mb-4">
                        <h4 className="text-xs font-body font-medium text-emerald-800 uppercase tracking-wider mb-1.5">Suggested fix</h4>
                        <p className="text-sm font-body text-emerald-900 leading-relaxed">
                          {issue.aiFixSuggestion}
                        </p>
                      </div>
                    )}

                    {issue.screenshotPath && (
                      <div className="mb-3">
                        <h4 className="text-xs font-body font-medium text-slate-600 mb-1">Screenshot</h4>
                        <img
                          src={issue.screenshotPath}
                          alt="Highlighted accessibility issue on page"
                          className="rounded-lg border border-slate-200 max-w-full max-h-64 object-contain bg-white"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-body font-medium text-slate-600 mb-1">Element</h4>
                        <code className="block text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-600 overflow-x-auto">
                          {issue.elementSelector}
                        </code>
                      </div>
                      {issue.elementHtml && (
                        <div>
                          <h4 className="text-xs font-body font-medium text-slate-600 mb-1">HTML</h4>
                          <code className="block text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                            {issue.elementHtml}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
