import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 122.88 122.88" fill="currentColor" className="text-emerald-600 shrink-0 group-hover:text-emerald-500 transition-colors">
              <path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z" />
            </svg>
            <span className="font-display font-bold text-xl text-ink tracking-tight">
              AccessEval
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-ghost text-slate-600">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Get started
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy-900 text-navy-300 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <svg width="22" height="22" viewBox="0 0 122.88 122.88" fill="currentColor" className="text-emerald-500 shrink-0">
                  <path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z" />
                </svg>
                <span className="font-display font-bold text-white tracking-tight">AccessEval</span>
              </Link>
              <p className="font-body text-sm text-navy-400 leading-relaxed">
                ADA compliance for school districts, cities, and counties.
              </p>
            </div>

            <div>
              <p className="font-body text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">Product</p>
              <nav aria-label="Product links" className="flex flex-col gap-2.5">
                <Link href="/#how-it-works" className="font-body text-sm text-navy-300 hover:text-white transition-colors">How it works</Link>
                <Link href="/#pricing" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Pricing</Link>
                <Link href="/schools" className="font-body text-sm text-navy-300 hover:text-white transition-colors">School reports</Link>
                <Link href="/signup" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Get started</Link>
              </nav>
            </div>

            <div>
              <p className="font-body text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">Resources</p>
              <nav aria-label="Resource links" className="flex flex-col gap-2.5">
                <Link href="/" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Free scan</Link>
                <Link href="/blog" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Blog</Link>
              </nav>
            </div>

            <div>
              <p className="font-body text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">Legal</p>
              <nav aria-label="Legal links" className="flex flex-col gap-2.5">
                <Link href="/privacy" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Privacy policy</Link>
                <Link href="/terms" className="font-body text-sm text-navy-300 hover:text-white transition-colors">Terms of use</Link>
              </nav>
            </div>
          </div>

          <div className="border-t border-navy-700 pt-8">
            <p className="font-body text-sm text-navy-500 text-center">
              &copy; {new Date().getFullYear()} AccessEval. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
