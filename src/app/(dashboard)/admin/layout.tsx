'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminTabs = [
  { label: 'Overview', href: '/admin' },
  { label: 'Organizations', href: '/admin/organizations' },
  { label: 'Scans', href: '/admin/scans' },
  { label: 'Free Scans', href: '/admin/free-scans' },
  { label: 'Districts', href: '/admin/districts' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="page-title">Admin</h1>
      </div>

      <nav className="flex gap-1 mb-8 border-b border-slate-200 -mx-1">
        {adminTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'px-4 py-2.5 text-sm font-body font-medium transition-colors relative',
                isActive
                  ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:rounded-full'
                  : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
