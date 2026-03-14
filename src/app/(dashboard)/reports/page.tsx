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
    <div>
      <h1 className="text-2xl font-bold mb-6">Board Reports</h1>
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600 mb-4">
          Generate a PDF report for your board or administration.
          Includes your accessibility grade, issue summary, progress, and recommendations.
        </p>
        <button
          onClick={generateReport}
          disabled={generating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Board Report PDF'}
        </button>
      </div>
    </div>
  );
}
