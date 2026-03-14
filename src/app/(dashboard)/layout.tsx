import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { authOptions } from '@/lib/auth';
import { getOrgSites, getActiveSite } from '@/lib/active-site';
import Sidebar from '@/components/ui/sidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const sites = await getOrgSites(session.user.organizationId);
  const activeSite = await getActiveSite(session.user.organizationId);
  const activeSiteId = activeSite?.id ?? sites[0]?.id ?? '';

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar sites={sites} activeSiteId={activeSiteId} />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {children}
      </main>
    </div>
  );
}
