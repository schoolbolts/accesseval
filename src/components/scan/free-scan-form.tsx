'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function FreeScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const res = await fetch('/api/scan/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      router.push(`/scan/${data.token}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <div className="flex-1">
        <label htmlFor="scan-url" className="sr-only">
          Website URL
        </label>
        <input
          id="scan-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourschool.edu"
          required
          disabled={loading}
          className="input-lg w-full bg-white/95 text-ink placeholder:text-slate-400 border-white/20 focus:border-white focus:ring-white/20"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-300 font-body">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary-lg whitespace-nowrap"
      >
        {loading ? (
          <>
            <svg
              aria-hidden="true"
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Starting scan...
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            Scan for free
          </>
        )}
      </button>
    </form>
  );
}
