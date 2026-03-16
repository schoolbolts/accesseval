import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function PublicStatementPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: { statement: true },
  });

  if (!org?.statement) notFound();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface bg-dot-pattern py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-10">
          <div
            className="prose-ae"
            dangerouslySetInnerHTML={{ __html: org.statement.statementHtml }}
          />
          <p className="font-body text-xs text-slate-600 mt-8 pt-6 border-t border-slate-100">
            Last updated:{' '}
            {org.statement.lastGeneratedAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
