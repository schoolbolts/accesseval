import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ScanProgress } from '@/components/scan/scan-progress';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const scan = await prisma.freeScan.findUnique({ where: { token }, select: { url: true, score: true, grade: true } });
  if (!scan || scan.score == null) {
    return { title: 'Scanning...' };
  }
  const hostname = new URL(scan.url).hostname;
  return {
    title: `${hostname} Accessibility Score: ${scan.grade} (${scan.score}/100)`,
    description: `Free accessibility scan results for ${hostname}. Score: ${scan.score}/100 (${scan.grade}). Check ADA Title II compliance.`,
    openGraph: {
      title: `${hostname} — Accessibility Score: ${scan.grade}`,
      description: `This site scored ${scan.score}/100 on our accessibility scan.`,
    },
  };
}

export default async function ScanResultsPage({ params }: PageProps) {
  const { token } = await params;
  return <ScanProgress token={token} />;
}
