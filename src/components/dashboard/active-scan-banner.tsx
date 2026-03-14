'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ActiveScanData {
  id: string;
  status: 'queued' | 'crawling' | 'scanning';
  pagesFound: number | null;
  pagesScanned: number | null;
}

export default function ActiveScanBanner({ initial }: { initial: ActiveScanData | null }) {
  const [scan, setScan] = useState<ActiveScanData | null>(initial);
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/scan/status');
      if (!res.ok) {
        setScan(null);
        return null;
      }
      const data = await res.json();
      if (data.status === 'idle') {
        setScan(null);
        router.refresh();
        return null;
      }
      setScan(data);
      return data;
    } catch {
      return scan;
    }
  }, [router, scan]);

  useEffect(() => {
    if (!scan) return;

    const interval = setInterval(async () => {
      const result = await poll();
      if (!result) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [scan, poll]);

  if (!scan) return null;

  const progress =
    scan.status === 'scanning' && scan.pagesFound && scan.pagesFound > 0
      ? Math.round(((scan.pagesScanned ?? 0) / scan.pagesFound) * 100)
      : null;

  return (
    <div className="mb-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="relative w-11 h-11 shrink-0">
            <div className="absolute inset-0 rounded-full border-[3px] border-white/20" />
            <div className="absolute inset-0 rounded-full border-[3px] border-white border-t-transparent animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-sm">
              Scan in progress
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                {scan.status}
              </span>
            </p>
            <p className="font-body text-emerald-100 text-xs mt-0.5">
              {scan.status === 'queued' && 'Waiting to start...'}
              {scan.status === 'crawling' && `Discovering pages on your site${scan.pagesFound ? ` (${scan.pagesFound} found)` : ''}...`}
              {scan.status === 'scanning' && (
                <>Scanning page {scan.pagesScanned ?? 0} of {scan.pagesFound ?? '?'}</>
              )}
            </p>
          </div>
          {progress !== null && (
            <span className="font-body text-sm font-bold text-white shrink-0">
              {progress}%
            </span>
          )}
        </div>
        {/* Progress bar */}
        {progress !== null && (
          <div className="relative mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
