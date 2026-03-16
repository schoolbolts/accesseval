import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { stripe as getStripe, INVOICE_AMOUNTS, createInvoice } from '@/lib/stripe';
import { PLAN_LIMITS, PlanName } from '@/lib/plan-limits';
import { validatePassword } from '@/lib/password';

const INVOICE_PLANS: PlanName[] = ['comply', 'fix'];

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

  const {
    orgName,
    billingContactName,
    billingContactEmail,
    billingAddress,
    plan,
    poNumber,
    password,
    siteUrl,
  } = body as {
    orgName?: string;
    billingContactName?: string;
    billingContactEmail?: string;
    billingAddress?: string;
    plan?: string;
    poNumber?: string;
    password?: string;
    siteUrl?: string;
  };

  // Validate required fields
  if (!orgName || !billingContactName || !billingContactEmail || !billingAddress || !plan || !password || !siteUrl) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!INVOICE_PLANS.includes(plan as PlanName)) {
    return NextResponse.json({ error: 'Invoice payment is only available for Comply and Fix plans.' }, { status: 400 });
  }

  const { valid, errors: passwordErrors } = validatePassword(password);
  if (!valid) {
    return NextResponse.json({ error: passwordErrors.join(', ') }, { status: 400 });
  }

  const selectedPlan = plan as PlanName;

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email: billingContactEmail } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = buildSlug(orgName);
  const maxPages = PLAN_LIMITS[selectedPlan].maxPages;

  // Create Stripe customer
  const customer = await getStripe().customers.create({
    email: billingContactEmail,
    name: orgName,
    address: { line1: billingAddress },
  });

  // Create Organization + User + Site
  // planStatus starts as 'past_due' — will become 'active' when invoice.paid webhook fires
  await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      stripeCustomerId: customer.id,
      plan: selectedPlan,
      planStatus: 'past_due',
      billingType: 'invoice',
      poNumber: poNumber || null,
      users: {
        create: {
          name: billingContactName,
          email: billingContactEmail,
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

  // Create and send the Stripe Invoice
  const amount = INVOICE_AMOUNTS[selectedPlan];
  const tierLabel = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);

  await createInvoice({
    customerId: customer.id,
    priceAmount: amount,
    description: `AccessEval ${tierLabel} plan — annual subscription`,
    poNumber: poNumber || undefined,
    daysUntilDue: 30,
  });

  return NextResponse.json({
    message: `Invoice sent to ${billingContactEmail}. Your account will be activated once payment is received.`,
  }, { status: 201 });
}
