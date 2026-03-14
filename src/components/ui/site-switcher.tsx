'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SiteSwitcherProps {
  sites: Array<{ id: string; url: string }>;
  activeSiteId: string;
}

export default function SiteSwitcher({ sites, activeSiteId }: SiteSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  if (sites.length <= 1) return null;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const siteId = e.target.value;
    if (siteId === activeSiteId) return;

    setSwitching(true);
    try {
      await fetch('/api/sites/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="px-5 pb-3">
      <select
        value={activeSiteId}
        onChange={handleChange}
        disabled={switching}
        className="w-full text-xs font-body bg-navy-800 text-slate-300 border border-navy-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 truncate"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.url.replace(/^https?:\/\//, '')}
          </option>
        ))}
      </select>
    </div>
  );
}
