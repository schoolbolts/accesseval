import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'School District Website Accessibility Reports',
  description:
    'Browse accessibility compliance reports for 17,000+ school districts across the US. Free ADA Title II compliance scores and WCAG 2.2 AA audit results.',
};

function gradeColor(grade: string | null) {
  if (!grade) return 'text-slate-600';
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  if (grade.startsWith('D')) return 'text-orange-600';
  return 'text-red-600';
}

function gradeRingColor(grade: string | null) {
  if (!grade) return 'ring-slate-200';
  if (grade.startsWith('A')) return 'ring-emerald-400';
  if (grade.startsWith('B')) return 'ring-blue-400';
  if (grade.startsWith('C')) return 'ring-amber-400';
  if (grade.startsWith('D')) return 'ring-orange-400';
  return 'ring-red-400';
}

export default async function SchoolsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; page?: string }>;
}) {
  const { state, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const PAGE_SIZE = 60;

  const where = state ? { stateCode: state.toUpperCase() } : {};

  const [districts, total, states] = await Promise.all([
    prisma.district.findMany({
      where,
      orderBy: [{ score: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        name: true,
        city: true,
        stateCode: true,
        website: true,
        score: true,
        grade: true,
      },
    }),
    prisma.district.count({ where }),
    prisma.district.groupBy({
      by: ['stateCode'],
      _count: true,
      orderBy: { stateCode: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const scannedCount = await prisma.district.count({ where: { ...where, score: { not: null } } });

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-up">
        <h1 className="font-display text-display-lg text-ink mb-3">
          School District Accessibility Reports
        </h1>
        <p className="font-body text-slate-600 max-w-lg mx-auto">
          {total.toLocaleString()} school districts{state ? ` in ${state.toUpperCase()}` : ' across the US'}.
          {scannedCount > 0 && ` ${scannedCount.toLocaleString()} scanned so far.`}
        </p>
      </div>

      {/* State filter */}
      <div className="mb-8 animate-fade-up stagger-1">
        <div className="flex flex-wrap gap-1.5 justify-center">
          <Link
            href="/schools"
            className={`px-3 py-1.5 text-xs font-body font-medium rounded-full transition-all ${
              !state
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            All
          </Link>
          {states.map((s) => (
            <Link
              key={s.stateCode}
              href={`/schools?state=${s.stateCode}`}
              className={`px-3 py-1.5 text-xs font-body font-medium rounded-full transition-all ${
                state?.toUpperCase() === s.stateCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.stateCode}
            </Link>
          ))}
        </div>
      </div>

      {/* District grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {districts.map((d) => (
          <Link
            key={d.slug}
            href={`/schools/${d.slug}`}
            className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow group"
          >
            <div className={`w-12 h-12 shrink-0 rounded-full ring-[3px] ${gradeRingColor(d.grade)} flex items-center justify-center`}>
              <span className={`font-display text-lg font-extrabold leading-none ${gradeColor(d.grade)}`}>
                {d.grade ?? '—'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-semibold text-ink truncate group-hover:text-emerald-600 transition-colors">
                {d.name}
              </p>
              <p className="font-body text-xs text-slate-600">
                {[d.city, d.stateCode].filter(Boolean).join(', ')}
              </p>
              {d.score !== null ? (
                <p className="font-body text-xs text-slate-600 mt-0.5">Score: {d.score}/100</p>
              ) : (
                <p className="font-body text-xs text-slate-600 mt-0.5">Not yet scanned</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/schools?${state ? `state=${state}&` : ''}page=${page - 1}`}
              className="px-4 py-2 text-sm font-body font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm font-body text-slate-600 px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/schools?${state ? `state=${state}&` : ''}page=${page + 1}`}
              className="px-4 py-2 text-sm font-body font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {/* SEO content */}
      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h2 className="font-display text-display-sm text-ink mb-3">
          ADA Website Accessibility for School Districts
        </h2>
        <p className="font-body text-sm text-slate-600 leading-relaxed">
          Under ADA Title II, all public school districts must ensure their websites are accessible
          to people with disabilities. AccessEval scans school websites against WCAG 2.2 Level AA
          standards and provides plain-English fix instructions. Browse reports by state or search
          for your district above.
        </p>
      </div>
    </div>
  );
}
