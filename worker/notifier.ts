import { prisma } from '../src/lib/db';
import { sendTemplateEmail } from '../src/lib/email';
import { canUseFeature } from '../src/lib/plan-limits';
import ScanCompleteEmail from '../emails/scan-complete';
import GradeDroppedEmail from '../emails/grade-dropped';
import type { Scan, Site, Organization } from '@prisma/client';
import type { PlanName } from '../src/lib/plan-limits';

export async function notifyScanComplete(
  scan: Scan & { site: Site & { organization: Organization } }
): Promise<void> {
  const org = scan.site.organization;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const plan = org.plan as PlanName;

  const users = await prisma.user.findMany({
    where: { organizationId: org.id },
    select: { email: true },
  });

  let gradeDropped = false;
  let previousScan: Scan | null = null;
  if (canUseFeature(plan, 'weeklyDigest')) {
    previousScan = await prisma.scan.findFirst({
      where: {
        siteId: scan.siteId,
        id: { not: scan.id },
        status: { in: ['completed', 'partial'] },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (previousScan?.score != null && scan.score != null) {
      gradeDropped = scan.score < previousScan.score;
    }
  }

  for (const user of users) {
    try {
      await sendTemplateEmail({
        to: user.email,
        subject: `AccessEval: Your site scored ${scan.grade} (${scan.score}/100)`,
        component: ScanCompleteEmail({
          orgName: org.name,
          grade: scan.grade || 'N/A',
          score: scan.score || 0,
          criticalCount: scan.criticalCount,
          majorCount: scan.majorCount,
          minorCount: scan.minorCount,
          dashboardUrl: `${baseUrl}/dashboard`,
        }),
      });

      if (gradeDropped && previousScan) {
        await sendTemplateEmail({
          to: user.email,
          subject: `AccessEval Alert: Grade dropped from ${previousScan.grade} to ${scan.grade}`,
          component: GradeDroppedEmail({
            orgName: org.name,
            previousGrade: previousScan.grade || 'N/A',
            currentGrade: scan.grade || 'N/A',
            previousScore: previousScan.score || 0,
            currentScore: scan.score || 0,
            dashboardUrl: `${baseUrl}/dashboard`,
          }),
        });
      }
    } catch (error) {
      console.error(`[notifier] Failed to send to ${user.email}:`, error);
    }
  }
}

export async function notifyPaymentFailed(stripeCustomerId: string): Promise<void> {
  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId },
    include: { users: { where: { role: 'owner' } } },
  });
  if (!org || org.users.length === 0) return;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const PaymentFailedEmail = (await import('../emails/payment-failed')).default;

  for (const user of org.users) {
    try {
      await sendTemplateEmail({
        to: user.email,
        subject: 'AccessEval: Payment failed — action required',
        component: PaymentFailedEmail({
          orgName: org.name,
          settingsUrl: `${baseUrl}/settings`,
        }),
      });
    } catch (error) {
      console.error(`[notifier] Payment-failed email failed for ${user.email}:`, error);
    }
  }
}

export async function notifyTeamInvite(params: {
  email: string;
  orgName: string;
  inviterName: string;
  inviteToken: string;
}): Promise<void> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const TeamInviteEmail = (await import('../emails/team-invite')).default;

  await sendTemplateEmail({
    to: params.email,
    subject: `You've been invited to ${params.orgName} on AccessEval`,
    component: TeamInviteEmail({
      orgName: params.orgName,
      inviterName: params.inviterName,
      inviteUrl: `${baseUrl}/signup?invite=${params.inviteToken}`,
    }),
  });
}
