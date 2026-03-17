import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rob@schoolbolts.com')
  .split(',')
  .map((e) => e.trim());

export async function GET(req: Request) {
  // Protect with a secret token
  const { searchParams } = new URL(req.url);
  if (CRON_SECRET && searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    todayFreeScans,
    todayFunnelEvents,
    todaySignups,
    todayScans,
    totalOrgs,
    totalFreeScans,
  ] = await Promise.all([
    prisma.freeScan.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { url: true, email: true, grade: true, score: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.funnelEvent.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { event: true, token: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organization.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        name: true,
        plan: true,
        utmSource: true,
        createdAt: true,
        users: { select: { email: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.scan.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.organization.count(),
    prisma.freeScan.count(),
  ]);

  // Aggregate funnel events
  const funnelCounts: Record<string, number> = {};
  for (const e of todayFunnelEvents) {
    funnelCounts[e.event] = (funnelCounts[e.event] || 0) + 1;
  }

  const freeScansWithEmail = todayFreeScans.filter((s) => s.email).length;
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  const html = buildEmailHtml({
    dateStr,
    todayFreeScans,
    freeScansWithEmail,
    funnelCounts,
    todaySignups,
    todayScans,
    totalOrgs,
    totalFreeScans,
  });

  for (const to of ADMIN_EMAILS) {
    await sendEmail({
      to,
      subject: `AccessEval Daily — ${todayFreeScans.length} free scans, ${todaySignups.length} signups`,
      html,
    });
  }

  return NextResponse.json({
    ok: true,
    sent: ADMIN_EMAILS.length,
    freeScans: todayFreeScans.length,
    signups: todaySignups.length,
  });
}

function buildEmailHtml(data: {
  dateStr: string;
  todayFreeScans: { url: string; email: string | null; grade: string | null; score: number | null; createdAt: Date }[];
  freeScansWithEmail: number;
  funnelCounts: Record<string, number>;
  todaySignups: { name: string; plan: string; utmSource: string | null; createdAt: Date; users: { email: string }[] }[];
  todayScans: number;
  totalOrgs: number;
  totalFreeScans: number;
}) {
  const { dateStr, todayFreeScans, freeScansWithEmail, funnelCounts, todaySignups, todayScans, totalOrgs, totalFreeScans } = data;

  const freeScansRows = todayFreeScans.length > 0
    ? todayFreeScans.map((s) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.email || '<span style="color:#9ca3af;">—</span>'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.url}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${s.grade || '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${s.score ?? '—'}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="padding:12px;text-align:center;color:#9ca3af;font-size:13px;">No free scans today</td></tr>';

  const signupRows = todaySignups.length > 0
    ? todaySignups.map((s) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.users[0]?.email || '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${s.plan}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.utmSource || '—'}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="padding:12px;text-align:center;color:#9ca3af;font-size:13px;">No signups today</td></tr>';

  const funnelRows = Object.keys(funnelCounts).length > 0
    ? Object.entries(funnelCounts).map(([event, count]) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${event}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${count}</td>
        </tr>`).join('')
    : '<tr><td colspan="2" style="padding:12px;text-align:center;color:#9ca3af;font-size:13px;">No funnel events today</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#059669;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;font-size:20px;font-weight:600;">AccessEval Daily Summary</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">${dateStr}</p>
    </div>

    <div style="background:white;padding:24px;border-radius:0 0 8px 8px;">
      <!-- Quick stats -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="text-align:center;padding:12px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${todayFreeScans.length}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Free Scans</div>
          </td>
          <td style="text-align:center;padding:12px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${freeScansWithEmail}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Emails Captured</div>
          </td>
          <td style="text-align:center;padding:12px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${todaySignups.length}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Signups</div>
          </td>
          <td style="text-align:center;padding:12px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${todayScans}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Paid Scans</div>
          </td>
        </tr>
      </table>

      <!-- Totals -->
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0 0 24px;">All-time: ${totalOrgs} orgs · ${totalFreeScans} free scans</p>

      <!-- Free Scans -->
      <h2 style="font-size:15px;font-weight:600;color:#111827;margin:0 0 8px;border-bottom:2px solid #059669;padding-bottom:6px;">Free Scans (${todayFreeScans.length})</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Email</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">URL</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Grade</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Score</th>
          </tr>
        </thead>
        <tbody>${freeScansRows}</tbody>
      </table>

      <!-- Funnel Activity -->
      <h2 style="font-size:15px;font-weight:600;color:#111827;margin:0 0 8px;border-bottom:2px solid #059669;padding-bottom:6px;">Funnel Activity</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Event</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Count</th>
          </tr>
        </thead>
        <tbody>${funnelRows}</tbody>
      </table>

      <!-- Signups -->
      <h2 style="font-size:15px;font-weight:600;color:#111827;margin:0 0 8px;border-bottom:2px solid #059669;padding-bottom:6px;">New Signups (${todaySignups.length})</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Email</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Org</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Plan</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">UTM</th>
          </tr>
        </thead>
        <tbody>${signupRows}</tbody>
      </table>

      <p style="font-size:11px;color:#9ca3af;text-align:center;margin:16px 0 0;">
        Sent from AccessEval · <a href="${process.env.BASE_URL || 'https://accesseval.com'}/admin" style="color:#059669;">View Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
