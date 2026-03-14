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
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Run scan now
          </>
        )}
      </button>
      {error && (
        <p className="text-xs font-body text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  );
}
