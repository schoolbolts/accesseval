import { prisma } from '../src/lib/db';
import { scanQueue } from '../src/lib/queue';
import { sendTemplateEmail } from '../src/lib/email';
import WeeklyDigestEmail from '../emails/weekly-digest';
import { canUseFeature } from '../src/lib/plan-limits';
import type { PlanName } from '../src/lib/plan-limits';

export async function runScheduledScans(): Promise<void> {
  console.log('[scheduler] Running scheduled scans...');

  const sites = await prisma.site.findMany({
    include: { organization: true },
  });

  for (const site of sites) {
    if (site.organization.planStatus !== 'active') continue;

    const shouldScan = await shouldRunScan(site);
    if (!shouldScan) continue;

    const activeScan = await prisma.scan.findFirst({
      where: { siteId: site.id, status: { in: ['queued', 'crawling', 'scanning'] } },
    });
    if (activeScan) continue;

    const scan = await prisma.scan.create({
      data: { siteId: site.id, triggeredBy: 'scheduled' },
    });

    await scanQueue.add('scan', {
      scanId: scan.id,
      siteId: site.id,
    });

    console.log(`[scheduler] Queued scan for ${site.url}`);
  }
}

async function shouldRunScan(site: { id: string; scanFrequency: string }): Promise<boolean> {
  const lastScan = await prisma.scan.findFirst({
    where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  if (!lastScan?.completedAt) return true;

  const elapsed = Date.now() - lastScan.completedAt.getTime();
  const DAY = 24 * 60 * 60 * 1000;

  if (site.scanFrequency === 'weekly') return elapsed >= 7 * DAY;
  if (site.scanFrequency === 'monthly') return elapsed >= 30 * DAY;
  return false;
}

export async function sendWeeklyDigests(): Promise<void> {
  console.log('[scheduler] Sending weekly digests...');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const orgs = await prisma.organization.findMany({
    where: { planStatus: 'active' },
    include: { sites: true, users: true },
  });

  for (const org of orgs) {
    if (!canUseFeature(org.plan as PlanName, 'weeklyDigest')) continue;
    if (org.sites.length === 0) continue;

    // Send digest for each site
    for (const site of org.sites) {
      const latestScan = await prisma.scan.findFirst({
        where: { siteId: site.id, status: { in: ['completed', 'partial'] } },
        orderBy: { completedAt: 'desc' },
      });
      if (!latestScan) continue;

      const previousScan = await prisma.scan.findFirst({
        where: { siteId: site.id, status: { in: ['completed', 'partial'] }, id: { not: latestScan.id } },
        orderBy: { completedAt: 'desc' },
      });

      const scoreChange = previousScan?.score != null
        ? (latestScan.score || 0) - previousScan.score
        : 0;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const issuesFixed = await prisma.siteIssue.count({
        where: { siteId: site.id, status: 'fixed', statusChangedAt: { gte: weekAgo } },
      });

      const topIssues = await prisma.issue.findMany({
        where: { scanId: latestScan.id },
        orderBy: [{ severity: 'asc' }],
        take: 3,
        select: { description: true, severity: true },
      });

      for (const user of org.users) {
        try {
          await sendTemplateEmail({
            to: user.email,
            subject: `AccessEval Weekly: ${org.name} — Grade ${latestScan.grade}`,
            component: WeeklyDigestEmail({
              orgName: org.name,
              grade: latestScan.grade || 'N/A',
              score: latestScan.score || 0,
              scoreChange,
              issuesFixed,
              topIssues: topIssues.map((i) => ({ title: i.description, severity: i.severity })),
              dashboardUrl: `${baseUrl}/dashboard`,
            }),
          });
        } catch (error) {
          console.error(`[scheduler] Digest failed for ${user.email}:`, error);
        }
      }
    }
  }
}

export async function cleanupFreescans(): Promise<void> {
  const deleted = await prisma.freeScan.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (deleted.count > 0) {
    console.log(`[scheduler] Cleaned up ${deleted.count} expired free scans`);
  }
}
