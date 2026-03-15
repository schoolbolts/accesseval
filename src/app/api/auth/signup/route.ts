import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { stripe as getStripe, PRICE_IDS, createCheckoutSession } from '@/lib/stripe';
import { PLAN_LIMITS, PlanName } from '@/lib/plan-limits';

const VALID_PLANS: PlanName[] = ['scan', 'comply', 'fix'];

function buildSlug(orgName: string): string {
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Date.now();
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, orgName, email, password, siteUrl, plan, utmSource, utmMedium, utmCampaign } = body as {
    name?: string;
    orgName?: string;
    email?: string;
    password?: string;
    siteUrl?: string;
    plan?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };

  // Validate required fields
  if (!name || !orgName || !email || !password || !siteUrl || !plan) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!VALID_PLANS.includes(plan as PlanName)) {
    return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
  }

  const selectedPlan = plan as PlanName;

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  const slug = buildSlug(orgName);
  const maxPages = PLAN_LIMITS[selectedPlan].maxPages;

  // In dev mode (no Stripe keys), skip Stripe and go straight to dashboard
  const isDev = !process.env.STRIPE_SECRET_KEY;

  let stripeCustomerId = `dev_${Date.now()}`;
  if (!isDev) {
    const customer = await getStripe().customers.create({ email, name: orgName });
    stripeCustomerId = customer.id;
  }

  // Create Organization + User + Site in one nested Prisma create
  await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      stripeCustomerId,
      plan: selectedPlan,
      planStatus: 'active',
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: 'owner',
        },
      },
      sites: {
        create: {
          url: siteUrl,
          maxPages,
        },
      },
    },
  });

  if (isDev) {
    // Skip Stripe checkout in dev — redirect straight to dashboard
    return NextResponse.json({ checkoutUrl: '/login' }, { status: 201 });
  }

  // Create Stripe checkout session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const priceId = PRICE_IDS[selectedPlan];

  const session = await createCheckoutSession({
    customerId: stripeCustomerId,
    priceId,
    successUrl: `${appUrl}/dashboard?checkout=success`,
    cancelUrl: `${appUrl}/signup?checkout=canceled`,
  });

  return NextResponse.json({ checkoutUrl: session.url }, { status: 201 });
}
