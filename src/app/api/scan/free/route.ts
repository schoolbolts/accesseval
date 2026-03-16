import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/db';
import { freeScanQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url } = body as { url?: string };

  // Validate URL
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
  }

  // Get IP address — try multiple headers for various proxy setups
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');
  const ip = cfIp || forwarded || realIp || '127.0.0.1';

  console.log(`[free-scan] IP detection: cf-connecting-ip=${cfIp}, x-forwarded-for=${forwarded}, x-real-ip=${realIp}, resolved=${ip}`);

  // Rate limit: 3 per IP per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentScans = await prisma.freeScan.count({
    where: {
      ipAddress: ip,
      createdAt: { gte: oneDayAgo },
    },
  });

  console.log(`[free-scan] Rate limit check: ip=${ip}, recentScans=${recentScans}/3`);

  if (recentScans >= 3) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. You can scan 3 URLs per day.' },
      { status: 429 }
    );
  }

  const token = uuid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const freeScan = await prisma.freeScan.create({
    data: {
      url: parsedUrl.href,
      token,
      ipAddress: ip,
      expiresAt,
    },
  });

  await freeScanQueue.add('free-scan', { freeScanId: freeScan.id, url: parsedUrl.href });

  return NextResponse.json({ token }, { status: 201 });
}
