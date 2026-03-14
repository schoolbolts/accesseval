'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TriggerScanButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleTrigger() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/scan/trigger', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to trigger scan');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p className="text-sm font-body text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          {error}
        </p>
      )}
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Starting...
          </>
        ) : (
          'Run scan now'
        )}
      </button>
    </div>
  );
}
