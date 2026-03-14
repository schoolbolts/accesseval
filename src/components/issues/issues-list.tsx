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
  page: { url: string; title: string | null };
}

interface IssuesListProps {
  issues: IssueItem[];
  showCmsInstructions: boolean;
}

const severityStyles: Record<IssueSeverity, { badge: string; label: string }> = {
  critical: { badge: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
  major: { badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Major' },
  minor: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Minor' },
};

const filters: { label: string; value: IssueSeverity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
];

export default function IssuesList({ issues, showCmsInstructions }: IssuesListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<IssueSeverity | 'all'>('all');
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);
  const visible = filtered.filter((i) => !ignored.has(i.id));

  async function handleIgnore(id: string) {
    try {
      await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      });
      setIgnored((prev) => { const next = new Set(prev); next.add(id); return next; });
    } catch {
      // silently fail — user can retry
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'px-3 py-1.5 text-sm rounded-lg font-medium transition-colors',
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{visible.length} shown</span>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No issues to display.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((issue) => {
            const styles = severityStyles[issue.severity];
            const isExpanded = expanded === issue.id;
            return (
              <div
                key={issue.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles.badge} shrink-0 mt-0.5`}
                  >
                    {styles.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {issue.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {issue.page.title || issue.page.url}
                    </p>
                    {issue.wcagCriteria && (
                      <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                        WCAG {issue.wcagCriteria}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleIgnore(issue.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : issue.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {isExpanded ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        How to fix
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{issue.fixInstructions}</p>
                    </div>

                    {showCmsInstructions && issue.fixInstructionsCms && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          CMS fix instructions
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {issue.fixInstructionsCms}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Element selector
                      </h4>
                      <code className="block text-xs bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono overflow-x-auto">
                        {issue.elementSelector}
                      </code>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Element HTML
                      </h4>
                      <code className="block text-xs bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                        {issue.elementHtml}
                      </code>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Page URL
                      </h4>
                      <a
                        href={issue.page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {issue.page.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Rule: {issue.axeRuleId}</span>
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
