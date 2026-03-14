import type { Scan, Site, Organization } from '@prisma/client';

export async function notifyScanComplete(
  scan: Scan & { site: Site & { organization: Organization } }
): Promise<void> {
  console.log(`[notifier] Scan ${scan.id} complete: grade=${scan.grade}`);
}
