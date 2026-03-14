import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function PublicStatementPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: { statement: true },
  });

  if (!org?.statement) notFound();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="prose" dangerouslySetInnerHTML={{ __html: org.statement.statementHtml }} />
      <p className="text-xs text-gray-400 mt-8">
        Last updated: {org.statement.lastGeneratedAt.toLocaleDateString()}
      </p>
    </div>
  );
}
