'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SiteSwitcher from './site-switcher';

interface SidebarProps {
  sites: Array<{ id: string; url: string }>;
  activeSiteId: string;
  isAdmin?: boolean;
}

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Issues',
    href: '/issues',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L18 17H2L10 2z" />
        <line x1="10" y1="9" x2="10" y2="12" />
        <circle cx="10" cy="14.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Pages',
    href: '/pages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <polyline points="12 2 12 6 16 6" />
        <line x1="7" y1="10" x2="13" y2="10" />
        <line x1="7" y1="13" x2="11" y2="13" />
      </svg>
    ),
  },
  {
    label: 'PDFs',
    href: '/pdfs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <polyline points="12 2 12 6 16 6" />
        <path d="M7 13c0-1 .6-1.5 1.5-1.5S10 12.5 10 13c0 1.2-1.5 2-1.5 2H10" />
        <line x1="7" y1="16" x2="8.5" y2="16" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="16" height="16" rx="2" />
        <line x1="6" y1="14" x2="6" y2="10" />
        <line x1="10" y1="14" x2="10" y2="7" />
        <line x1="14" y1="14" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    label: 'Statement',
    href: '/statement',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l2.5 4L18 7l-4 4 1 5.5L10 14l-5 2.5L6 11 2 7l5.5-1L10 2z" />
      </svg>
    ),
  },
  {
    label: 'History',
    href: '/history',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <polyline points="10 6 10 10 13 13" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export default function Sidebar({ sites, activeSiteId, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-navy-900 flex flex-col shrink-0">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-5 border-b border-navy-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <svg width="30" height="30" viewBox="0 0 122.88 122.88" fill="currentColor" className="text-emerald-400 shrink-0 group-hover:text-emerald-300 transition-colors">
            <path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z" />
          </svg>
          <span className="font-display text-white font-bold text-lg tracking-tight">
            AccessEval
          </span>
        </Link>
      </div>

      {/* Site switcher (shown when org has multiple sites) */}
      <SiteSwitcher sites={sites} activeSiteId={activeSiteId} />

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/8 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500 before:rounded-full'
                  : 'text-slate-400 hover:text-white hover:bg-navy-800',
              ].join(' ')}
            >
              <span className={isActive ? 'text-emerald-400' : ''}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-3 mt-2">
          <Link
            href="/admin"
            className={[
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname.startsWith('/admin')
                ? 'bg-white/8 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-500 before:rounded-full'
                : 'text-slate-400 hover:text-white hover:bg-navy-800',
            ].join(' ')}
          >
            <span className={pathname.startsWith('/admin') ? 'text-amber-400' : ''}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" transform="scale(0.8) translate(2,2)" />
                <path d="M2 12l10 5 10-5" transform="scale(0.8) translate(2,2)" />
              </svg>
            </span>
            Admin
          </Link>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-navy-800 mx-3" />

      {/* Bottom section */}
      <div className="px-3 py-4">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-navy-800 transition-all duration-150"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 15l4-5-4-5" />
            <path d="M17 10H7" />
            <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" />
          </svg>
          Log out
        </Link>
      </div>
    </aside>
  );
}
