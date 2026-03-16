'use client';

import { useState } from 'react';

type IssueSeverity = 'critical' | 'major' | 'minor';

interface IssueItem {
  id: string;
  axeRuleId: string;
  severity: IssueSeverity;
  description: string;
  fixInstructions: string;
  fixInstructionsCms: string | null;
  elementSelector: string;
  elementHtml: string;
  wcagCriteria: string | null;
  fingerprint: string;
  aiFixSuggestion: string | null;
  page: { url: string; title: string | null };
}

interface IssuesListProps {
  issues: IssueItem[];
  showCmsInstructions: boolean;
  showAiSuggestions: boolean;
}

const severityBadge: Record<IssueSeverity, string> = {
  critical: 'badge-critical',
  major: 'badge-major',
  minor: 'badge-minor',
};

const filters: { label: string; value: IssueSeverity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
];

export default function IssuesList({ issues, showCmsInstructions, showAiSuggestions }: IssuesListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<IssueSeverity | 'all'>('all');
  const [statusMap, setStatusMap] = useState<Record<string, 'open' | 'fixed' | 'ignored'>>({});
  const [showResolved, setShowResolved] = useState(false);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);
  const visible = showResolved
    ? filtered
    : filtered.filter((i) => !['fixed', 'ignored'].includes(statusMap[i.id] ?? 'open'));

  async function updateIssueStatus(id: string, status: 'open' | 'fixed' | 'ignored') {
    try {
      await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setStatusMap((prev) => ({ ...prev, [id]: status }));
    } catch {
      // silently fail — user can retry
    }
  }

  return (
    <div>
      {/* Filter pill tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'px-4 py-1.5 text-sm font-body font-medium rounded-full transition-all duration-150',
              filter === f.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-ink',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-sm font-body text-slate-600 self-center cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="accent-emerald-600"
          />
          Show resolved
        </label>
        <span className="text-sm font-body text-slate-600 self-center">{visible.length} shown</span>
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-600 text-sm font-body">No issues to display.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((issue) => {
            const isExpanded = expanded === issue.id;
            return (
              <div
                key={issue.id}
                className="card overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-start gap-3 p-4">
                  <span className={`${severityBadge[issue.severity]} shrink-0 mt-0.5`}>
                    {issue.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-ink leading-snug">
                      {issue.description}
                    </p>
                    <p className="text-xs font-body text-slate-600 mt-0.5 truncate">
                      {issue.page.title || issue.page.url}
                    </p>
                    {issue.wcagCriteria && (
                      <span className="inline-block mt-1.5 text-xs font-body text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5">
                        WCAG {issue.wcagCriteria}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(statusMap[issue.id] === 'fixed' || statusMap[issue.id] === 'ignored') ? (
                      <>
                        <span className={`text-xs font-body font-medium ${statusMap[issue.id] === 'fixed' ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {statusMap[issue.id] === 'fixed' ? 'Fixed' : 'Ignored'}
                        </span>
                        <button
                          onClick={() => updateIssueStatus(issue.id, 'open')}
                          className="text-xs font-body text-slate-600 hover:text-slate-600 transition-colors"
                        >
                          Reopen
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => updateIssueStatus(issue.id, 'fixed')}
                          className="text-xs font-body text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => updateIssueStatus(issue.id, 'ignored')}
                          className="text-xs font-body text-slate-600 hover:text-slate-600 transition-colors"
                        >
                          Ignore
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : issue.id)}
                      className="text-xs font-body text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      {isExpanded ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 bg-surface space-y-4">
                    <div>
                      <h4 className="section-title mb-2">How to fix</h4>
                      <p className="text-sm font-body text-slate-700 leading-relaxed">{issue.fixInstructions}</p>
                    </div>

                    {showCmsInstructions && issue.fixInstructionsCms && (
                      <div>
                        <h4 className="section-title mb-2">CMS fix instructions</h4>
                        <p className="text-sm font-body text-slate-700 leading-relaxed">
                          {issue.fixInstructionsCms}
                        </p>
                      </div>
                    )}

                    {showAiSuggestions && issue.aiFixSuggestion && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="section-title text-emerald-800">Suggested fix</h4>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(issue.aiFixSuggestion!)}
                            className="text-xs font-body text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-sm font-body text-emerald-900 leading-relaxed">
                          {issue.aiFixSuggestion}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="section-title mb-2">Element selector</h4>
                      <code className="block text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 overflow-x-auto">
                        {issue.elementSelector}
                      </code>
                    </div>

                    <div>
                      <h4 className="section-title mb-2">Element HTML</h4>
                      <code className="block text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 overflow-x-auto whitespace-pre-wrap break-all">
                        {issue.elementHtml}
                      </code>
                    </div>

                    <div>
                      <h4 className="section-title mb-2">Page URL</h4>
                      <a
                        href={issue.page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-emerald-600 hover:text-emerald-700 hover:underline break-all"
                      >
                        {issue.page.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-body text-slate-600">
                      <span>Rule: <span className="font-mono">{issue.axeRuleId}</span></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
