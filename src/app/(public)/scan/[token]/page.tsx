import { ScanProgress } from '@/components/scan/scan-progress';

interface PageProps {
  params: { token: string };
}

export const metadata = {
  title: 'Scan Results — AccessEval',
};

export default function ScanResultsPage({ params }: PageProps) {
  return <ScanProgress token={params.token} />;
}
