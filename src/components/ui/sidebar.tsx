'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Issues', href: '/issues' },
  { label: 'Pages', href: '/pages' },
  { label: 'PDFs', href: '/pdfs' },
  { label: 'Reports', href: '/reports' },
  { label: 'Statement', href: '/statement' },
  { label: 'History', href: '/history' },
  { label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <Link href="/dashboard" className="text-white font-bold text-lg tracking-tight">
          AccessEval
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              ].join(' ')}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
