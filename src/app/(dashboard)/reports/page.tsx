'use client';

import { useState } from 'react';

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate report');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accesseval-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="page-title">Board Reports</h1>
        <p className="page-subtitle">Generate a compliance report for your board or administration.</p>
      </div>

      <div className="card p-8 animate-fade-up stagger-1">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="16" height="16" rx="2" />
              <line x1="6" y1="14" x2="6" y2="10" />
              <line x1="10" y1="14" x2="10" y2="7" />
              <line x1="14" y1="14" x2="14" y2="11" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-body font-semibold text-ink mb-1">Accessibility Compliance Report</h2>
            <p className="text-sm font-body text-slate-600 mb-5 leading-relaxed">
              Includes your accessibility grade, issue summary, progress over time, and actionable recommendations.
              Ready to share with leadership, legal, or your board.
            </p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="btn-primary"
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Board Report PDF'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
