# Tier Restructure & PO Invoicing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure pricing tiers from site-limited to page-budget model with unlimited sites, add AI fix suggestions feature flag, and add PO/invoice payment for Comply ($299) and Fix ($599) tiers.

**Architecture:** Update plan-limits config to change site caps (1/Infinity/Infinity) and add two new feature flags (`aiFixSuggestions`, `invoicePayment`). Add Stripe Invoicing as an alternative payment path for Comply/Fix tiers — form submits to API that creates and sends a Stripe Invoice with NET-30 terms, account activates on `invoice.paid` webhook. Update all pricing UI (landing page, signup, settings) to reflect unlimited sites, AI fix row, PO badge, and Manage placeholder.

**Tech Stack:** Next.js 14 App Router, Prisma/PostgreSQL, Stripe Invoicing API, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-15-tier-restructure-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/plan-limits.ts` | Modify | Update maxSites, add `aiFixSuggestions` + `invoicePayment` feature flags |
| `tests/unit/plan-limits.test.ts` | Modify | Update existing tests, add tests for new features/limits |
| `prisma/schema.prisma` | Modify | Add `poNumber`, `billingType` to Organization |
| `src/lib/stripe.ts` | Modify | Add `createInvoice()` helper |
| `src/app/api/invoices/request/route.ts` | Create | Invoice request API — creates Stripe Invoice + org/user |
| `src/app/api/webhooks/stripe/route.ts` | Modify | Handle `invoice.paid` event for invoice-path activation |
| `src/app/(public)/page.tsx` | Modify | Update pricing section (unlimited sites, AI fixes, PO badge, Manage placeholder) |
| `src/app/(public)/signup/page.tsx` | Modify | Update plan cards + comparison table |
| `src/app/(public)/invoice-request/page.tsx` | Create | Invoice request form page |
| `src/app/(dashboard)/settings/page.tsx` | Modify | Show page budget usage instead of site count |
| `CLAUDE.md` | Modify | Update tier table |

---

## Chunk 1: Plan Limits + Data Model

### Task 1: Update plan-limits.ts — site limits and feature flags

**Files:**
- Modify: `src/lib/plan-limits.ts`
- Modify: `tests/unit/plan-limits.test.ts`

- [ ] **Step 1: Update the existing plan-limits tests to expect new values**

Add tests for the new site limits and feature flags. Update existing site limit expectations.

In `tests/unit/plan-limits.test.ts`, add these tests:

```typescript
import { describe, it, expect } from 'vitest';
import { canUseFeature, getMaxPages, getOnDemandLimit, getTeamMemberLimit, getMaxSites } from '../../src/lib/plan-limits';

describe('canUseFeature', () => {
  it('scan tier cannot use issue tracking', () => {
    expect(canUseFeature('scan', 'issueTracking')).toBe(false);
  });

  it('comply tier can use issue tracking', () => {
    expect(canUseFeature('comply', 'issueTracking')).toBe(true);
  });

  it('scan tier cannot use board reports', () => {
    expect(canUseFeature('scan', 'boardReport')).toBe(false);
  });

  it('comply tier can use board reports', () => {
    expect(canUseFeature('comply', 'boardReport')).toBe(true);
  });

  it('comply tier cannot use CMS fix instructions', () => {
    expect(canUseFeature('comply', 'cmsFixInstructions')).toBe(false);
  });

  it('fix tier can use CMS fix instructions', () => {
    expect(canUseFeature('fix', 'cmsFixInstructions')).toBe(true);
  });

  // New feature flag tests
  it('scan tier cannot use AI fix suggestions', () => {
    expect(canUseFeature('scan', 'aiFixSuggestions')).toBe(false);
  });

  it('comply tier cannot use AI fix suggestions', () => {
    expect(canUseFeature('comply', 'aiFixSuggestions')).toBe(false);
  });

  it('fix tier can use AI fix suggestions', () => {
    expect(canUseFeature('fix', 'aiFixSuggestions')).toBe(true);
  });

  it('scan tier cannot use invoice payment', () => {
    expect(canUseFeature('scan', 'invoicePayment')).toBe(false);
  });

  it('comply tier can use invoice payment', () => {
    expect(canUseFeature('comply', 'invoicePayment')).toBe(true);
  });

  it('fix tier can use invoice payment', () => {
    expect(canUseFeature('fix', 'invoicePayment')).toBe(true);
  });
});

describe('getMaxPages', () => {
  it('scan = 100', () => expect(getMaxPages('scan')).toBe(100));
  it('comply = 500', () => expect(getMaxPages('comply')).toBe(500));
  it('fix = 2000', () => expect(getMaxPages('fix')).toBe(2000));
});

describe('getOnDemandLimit', () => {
  it('scan = 2', () => expect(getOnDemandLimit('scan')).toBe(2));
  it('comply = 5', () => expect(getOnDemandLimit('comply')).toBe(5));
  it('fix = Infinity', () => expect(getOnDemandLimit('fix')).toBe(Infinity));
});

describe('getTeamMemberLimit', () => {
  it('scan = 1', () => expect(getTeamMemberLimit('scan')).toBe(1));
  it('comply = 3', () => expect(getTeamMemberLimit('comply')).toBe(3));
  it('fix = 10', () => expect(getTeamMemberLimit('fix')).toBe(10));
});

describe('getMaxSites', () => {
  it('scan = 1', () => expect(getMaxSites('scan')).toBe(1));
  it('comply = Infinity', () => expect(getMaxSites('comply')).toBe(Infinity));
  it('fix = Infinity', () => expect(getMaxSites('fix')).toBe(Infinity));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/plan-limits.test.ts`
Expected: FAIL — `getMaxSites('comply')` returns 5 not Infinity, `canUseFeature` fails for unknown features `aiFixSuggestions` and `invoicePayment`.

- [ ] **Step 3: Update plan-limits.ts with new values**

Replace the full content of `src/lib/plan-limits.ts`:

```typescript
export const PLAN_LIMITS = {
  scan: {
    maxPages: 100,
    maxSites: 1,
    scanFrequency: 'monthly' as const,
    onDemandScansPerMonth: 2,
    teamMembers: 1,
    features: {
      issueTracking: false,
      progressChart: false,
      boardReport: false,
      accessibilityStatement: false,
      auditTrail: false,
      shareLinks: false,
      pdfInventory: false,
      cmsFixInstructions: false,
      weeklyDigest: false,
      aiFixSuggestions: false,
      invoicePayment: false,
    },
  },
  comply: {
    maxPages: 500,
    maxSites: Infinity,
    scanFrequency: 'weekly' as const,
    onDemandScansPerMonth: 5,
    teamMembers: 3,
    features: {
      issueTracking: true,
      progressChart: true,
      boardReport: true,
      accessibilityStatement: true,
      auditTrail: true,
      shareLinks: true,
      pdfInventory: true,
      cmsFixInstructions: false,
      weeklyDigest: true,
      aiFixSuggestions: false,
      invoicePayment: true,
    },
  },
  fix: {
    maxPages: 2000,
    maxSites: Infinity,
    scanFrequency: 'weekly' as const,
    onDemandScansPerMonth: Infinity,
    teamMembers: 10,
    features: {
      issueTracking: true,
      progressChart: true,
      boardReport: true,
      accessibilityStatement: true,
      auditTrail: true,
      shareLinks: true,
      pdfInventory: true,
      cmsFixInstructions: true,
      weeklyDigest: true,
      aiFixSuggestions: true,
      invoicePayment: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type FeatureName = keyof typeof PLAN_LIMITS.scan.features;

export function canUseFeature(plan: PlanName, feature: FeatureName): boolean {
  return PLAN_LIMITS[plan].features[feature];
}

export function getMaxPages(plan: PlanName): number {
  return PLAN_LIMITS[plan].maxPages;
}

export function getOnDemandLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan].onDemandScansPerMonth;
}

export function getTeamMemberLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan].teamMembers;
}

export function getMaxSites(plan: PlanName): number {
  return PLAN_LIMITS[plan].maxSites;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/plan-limits.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan-limits.ts tests/unit/plan-limits.test.ts
git commit -m "feat: update plan limits — unlimited sites for Comply/Fix, add aiFixSuggestions and invoicePayment flags"
```

---

### Task 2: Add poNumber and billingType to Organization schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new fields to Organization model**

In `prisma/schema.prisma`, add two fields to the `Organization` model, after the `utmCampaign` field (line 111) and before `createdAt` (line 112):

```prisma
  poNumber    String?    @map("po_number")
  billingType String     @default("card") @map("billing_type")
```

The Organization model's fields section should now end with:

```prisma
  utmSource        String?    @map("utm_source")
  utmMedium        String?    @map("utm_medium")
  utmCampaign      String?    @map("utm_campaign")
  poNumber         String?    @map("po_number")
  billingType      String     @default("card") @map("billing_type")
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @updatedAt @map("updated_at")
```

- [ ] **Step 2: Generate Prisma migration**

Run: `npx prisma migrate dev --name add-po-number-billing-type`

Expected: Migration created successfully, Prisma client regenerated.

- [ ] **Step 3: Verify Prisma client generates**

Run: `npx prisma generate`

Expected: `Prisma Client generated successfully`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add poNumber and billingType fields to Organization"
```

---

## Chunk 2: Invoice Payment Flow

### Task 3: Add createInvoice helper to stripe.ts

**Files:**
- Modify: `src/lib/stripe.ts`

- [ ] **Step 1: Add createInvoice function**

Add after the existing `createCustomerPortalSession` function (line 41) in `src/lib/stripe.ts`:

```typescript
export async function createInvoice(params: {
  customerId: string;
  priceAmount: number;
  description: string;
  poNumber?: string;
  daysUntilDue?: number;
}) {
  const stripe = getStripe();

  // Create a one-off invoice item
  await stripe.invoiceItems.create({
    customer: params.customerId,
    amount: params.priceAmount,
    currency: 'usd',
    description: params.description,
  });

  // Create and finalize the invoice
  const invoice = await stripe.invoices.create({
    customer: params.customerId,
    collection_method: 'send_invoice',
    days_until_due: params.daysUntilDue ?? 30,
    metadata: params.poNumber ? { po_number: params.poNumber } : {},
    auto_advance: true,
    payment_settings: {
      payment_method_types: ['us_bank_account'],
    },
  });

  // Finalize and send
  await stripe.invoices.finalizeInvoice(invoice.id);
  await stripe.invoices.sendInvoice(invoice.id);

  return invoice;
}
```

Also add to `PRICE_IDS` — export the amounts for invoice pricing (these are cent values matching the annual subscription prices):

```typescript
export const INVOICE_AMOUNTS: Record<string, number> = {
  comply: 29900,  // $299.00
  fix: 59900,     // $599.00
};
```

- [ ] **Step 2: Configure Stripe Dashboard settings (manual)**

These cannot be set via the API and must be configured in the Stripe Dashboard:

1. **Settings > Product settings > Invoicing** — enable Invoicing
2. **Settings > Payment methods** — enable ACH / bank transfer for invoices
3. **Settings > Invoicing > Reminders** — add automatic payment reminders at day 15 and day 30
4. **Settings > Invoicing > Overdue** — auto-void unpaid invoices after 60 days

Verify these are configured before testing the invoice flow end-to-end.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add createInvoice helper and INVOICE_AMOUNTS to stripe lib"
```

---

### Task 4: Create invoice request API route

**Files:**
- Create: `src/app/api/invoices/request/route.ts`

- [ ] **Step 1: Create the API route**

Create `src/app/api/invoices/request/route.ts`:

```typescript
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
```

- [ ] **Step 2: Verify the file builds**

Run: `npx tsc --noEmit src/app/api/invoices/request/route.ts 2>&1 || echo "TypeScript check skipped (Next.js handles this)"`

Then verify with: `npm run build`

Expected: No type errors related to the new route.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/invoices/request/route.ts
git commit -m "feat: add invoice request API route — creates Stripe invoice with NET-30 terms"
```

---

### Task 5: Handle invoice.paid webhook for account activation

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add invoice.paid handler**

In `src/app/api/webhooks/stripe/route.ts`, add a new case in the switch statement, after the `invoice.payment_failed` case (after line 128):

```typescript
      case 'invoice.paid': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          // Activate account when invoice is paid (PO/invoice payment path)
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId, billingType: 'invoice' },
            data: { planStatus: 'active' },
          });
        }
        break;
      }
```

This only activates orgs with `billingType: 'invoice'` to avoid interfering with existing subscription invoice events. Card-path orgs are activated by `checkout.session.completed` as before.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: handle invoice.paid webhook — activate invoice-path accounts on payment"
```

---

## Chunk 3: UI Updates

### Task 6: Update landing page pricing section

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Update pricing section**

Replace the entire pricing `<section>` (lines 248-408) in `src/app/(public)/page.tsx`. Key changes:
- Scan: "1 website" stays, no site count change
- Comply: "Up to 5 websites, 500 pages each" → "Unlimited websites, up to 500 pages"
- Fix: "Up to 10 websites, 2,000 pages each" → "Unlimited websites, up to 2,000 pages"
- Fix: Add "AI-powered fix suggestions" feature
- Comply + Fix: Add "PO / invoice available" line
- Add 4th column: Manage ("Contact us" placeholder)
- Grid changes from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`

Replace the pricing section with:

```tsx
      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 px-4 bg-surface bg-dot-pattern"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-title mb-3">Transparent pricing</p>
            <h2
              id="pricing-heading"
              className="font-display text-display-md text-ink mb-3"
            >
              Simple, annual pricing
            </h2>
            <p className="font-body text-slate-600 max-w-md mx-auto">
              Everything you need to achieve and maintain ADA compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {/* Scan tier */}
            <div className="card p-8 flex flex-col">
              <h3 className="font-display text-display-sm text-ink mb-1">Scan</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$99</span>
                <span className="font-body text-slate-600 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-600 text-sm mb-6">
                Automated monthly scans and baseline compliance reporting.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  '1 website, up to 100 pages',
                  'Monthly automated scans',
                  '2 on-demand scans/month',
                  'Letter grade + issue counts',
                  'WCAG 2.2 AA coverage',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=scan"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-body font-semibold text-sm text-emerald-700 border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Comply tier — highlighted */}
            <div className="card p-8 flex flex-col ring-2 ring-emerald-500 shadow-glow relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="badge-success px-3 py-1 text-xs font-semibold">
                  Most popular
                </span>
              </div>
              <h3 className="font-display text-display-sm text-ink mb-1">Comply</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$299</span>
                <span className="font-body text-slate-600 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-600 text-sm mb-6">
                Weekly scans, fix tracking, and official compliance documentation.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  'Unlimited websites, up to 500 pages',
                  'Weekly automated scans',
                  '5 on-demand scans/month',
                  'Fix tracking dashboard',
                  'Accessibility statement generator',
                  'Team access (3 seats)',
                  'Email digest reports',
                  'PO / invoice available',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/signup?plan=comply" className="btn-primary justify-center">
                Get started
              </a>
            </div>

            {/* Fix tier */}
            <div className="card p-8 flex flex-col">
              <h3 className="font-display text-display-sm text-ink mb-1">Fix</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-display-lg text-ink">$599</span>
                <span className="font-body text-slate-600 text-sm">/yr</span>
              </div>
              <p className="font-body text-slate-600 text-sm mb-6">
                AI-powered fix suggestions with CMS-specific instructions.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  'Unlimited websites, up to 2,000 pages',
                  'Weekly automated scans',
                  'Unlimited on-demand scans',
                  'AI-powered fix suggestions',
                  'CMS-specific fix instructions',
                  'Shared reports for IT vendors',
                  'Priority support + 10 team seats',
                  'PO / invoice available',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-slate-600">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/signup?plan=fix"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-body font-semibold text-sm text-emerald-700 border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Get started
              </a>
            </div>

            {/* Manage tier — Contact us placeholder */}
            <div className="card p-8 flex flex-col border-2 border-dashed border-slate-200">
              <h3 className="font-display text-display-sm text-ink mb-1">Manage</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-body text-slate-600 text-sm font-semibold">Contact us for pricing</span>
              </div>
              <p className="font-body text-slate-600 text-sm mb-6">
                Hands-on remediation — we fix your site for you.
              </p>
              <ul className="space-y-3 mb-8 flex-1 text-sm font-body">
                {[
                  'Everything in Fix, plus:',
                  '30-day remediation engagement',
                  'CMS access + direct fixes',
                  'PO / invoicing',
                  'Dedicated support',
                ].map((feat, i) => (
                  <li key={feat} className={`flex items-start gap-2.5 ${i === 0 ? 'text-ink font-medium' : 'text-slate-600'}`}>
                    {i > 0 && (
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@accesseval.com?subject=Manage%20tier%20inquiry"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-body font-semibold text-sm text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: update pricing page — unlimited sites, AI fixes, PO badge, Manage placeholder"
```

---

### Task 7: Update signup page plan cards and comparison

**Files:**
- Modify: `src/app/(public)/signup/page.tsx`

- [ ] **Step 1: Update PLANS array and COMPARE_ROWS**

In `src/app/(public)/signup/page.tsx`, replace the `PLANS` array (lines 7-45) with:

```typescript
const PLANS = [
  {
    id: 'scan',
    label: 'Scan',
    price: '$99',
    period: '/yr',
    tagline: 'Find out where you stand',
    features: ['1 website, up to 100 pages', 'Monthly automated scans', 'Letter grade + PDF reports'],
    popular: false,
  },
  {
    id: 'comply',
    label: 'Comply',
    price: '$299',
    period: '/yr',
    tagline: 'Stay compliant year-round',
    features: [
      'Unlimited websites, up to 500 pages',
      'Weekly scans + fix tracking',
      'Compliance docs + accessibility statement',
      'Team member access (3 seats)',
    ],
    popular: true,
  },
  {
    id: 'fix',
    label: 'Fix',
    price: '$599',
    period: '/yr',
    tagline: 'AI-powered fix suggestions',
    features: [
      'Unlimited websites, up to 2,000 pages',
      'AI fix suggestions + CMS-specific instructions',
      'Shareable reports for IT vendors',
      'Priority support + all Comply features',
    ],
    popular: false,
  },
] as const;
```

Replace the `COMPARE_ROWS` array (lines 47-62) with:

```typescript
const COMPARE_ROWS = [
  { label: 'Websites', scan: '1', comply: 'Unlimited', fix: 'Unlimited' },
  { label: 'Pages per site', scan: '100', comply: '500', fix: '2,000' },
  { label: 'Scan frequency', scan: 'Monthly', comply: 'Weekly', fix: 'Weekly' },
  { label: 'On-demand scans', scan: '2/month', comply: '5/month', fix: 'Unlimited' },
  { label: 'Letter grade + issue counts', scan: true, comply: true, fix: true },
  { label: 'WCAG 2.2 AA coverage', scan: true, comply: true, fix: true },
  { label: 'PDF reports', scan: true, comply: true, fix: true },
  { label: 'Fix tracking dashboard', scan: false, comply: true, fix: true },
  { label: 'Accessibility statement generator', scan: false, comply: true, fix: true },
  { label: 'Team member access', scan: false, comply: true, fix: true },
  { label: 'Email digest reports', scan: false, comply: true, fix: true },
  { label: 'AI-powered fix suggestions', scan: false, comply: false, fix: true },
  { label: 'CMS-specific fix instructions', scan: false, comply: false, fix: true },
  { label: 'Shared reports for IT vendors', scan: false, comply: false, fix: true },
  { label: 'Priority email support', scan: false, comply: false, fix: true },
  { label: 'PO / invoice payment', scan: false, comply: true, fix: true },
];
```

- [ ] **Step 2: Add "Need a PO or invoice?" link below the submit button**

In the same file, after the "You'll complete payment on the next screen" paragraph (line 358), add:

```tsx
            {(plan === 'comply' || plan === 'fix') && (
              <p className="text-center font-body text-xs text-slate-600">
                <a
                  href={`/invoice-request?plan=${plan}`}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
                >
                  Need a PO or invoice?
                </a>
              </p>
            )}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/signup/page.tsx
git commit -m "feat: update signup page — unlimited sites, AI fix row, PO invoice link"
```

---

### Task 8: Create invoice request form page

**Files:**
- Create: `src/app/(public)/invoice-request/page.tsx`

- [ ] **Step 1: Create the invoice request page**

Create `src/app/(public)/invoice-request/page.tsx`:

```tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvoiceRequestWrapper() {
  return (
    <Suspense>
      <InvoiceRequestPage />
    </Suspense>
  );
}

function InvoiceRequestPage() {
  const searchParams = useSearchParams();
  const [orgName, setOrgName] = useState('');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'comply' | 'fix'>(
    (searchParams.get('plan') as 'comply' | 'fix') || 'comply'
  );
  const [poNumber, setPoNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/invoices/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          billingContactName,
          billingContactEmail,
          billingAddress,
          siteUrl,
          password,
          plan,
          poNumber: poNumber || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(data.message);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-emerald-500">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="font-display text-display-sm text-ink mb-3">Invoice sent</h1>
            <p className="font-body text-slate-600 text-sm mb-6">{success}</p>
            <Link href="/login" className="btn-primary justify-center">
              Log in to your account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-surface bg-dot-pattern">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-display-md text-ink">Request a PO / Invoice</h1>
          <p className="font-body text-slate-600 mt-2">
            We&apos;ll send a NET-30 invoice to your billing contact. Your account activates once payment is received.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="siteUrl" className="label">Website URL</label>
              <input
                id="siteUrl"
                type="url"
                required
                autoFocus
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="input"
                placeholder="https://www.springfieldusd.org"
              />
            </div>

            <div>
              <label htmlFor="orgName" className="label">Organization name</label>
              <input
                id="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input"
                placeholder="Springfield Unified School District"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="billingContactName" className="label">Billing contact name</label>
                <input
                  id="billingContactName"
                  type="text"
                  required
                  value={billingContactName}
                  onChange={(e) => setBillingContactName(e.target.value)}
                  className="input"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="billingContactEmail" className="label">Billing contact email</label>
                <input
                  id="billingContactEmail"
                  type="email"
                  required
                  value={billingContactEmail}
                  onChange={(e) => setBillingContactEmail(e.target.value)}
                  className="input"
                  placeholder="jane@springfieldusd.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="billingAddress" className="label">Billing address</label>
              <textarea
                id="billingAddress"
                required
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="input"
                placeholder="123 Main St, Springfield, IL 62701"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <p className="label">Select plan</p>
              <div className="grid grid-cols-2 gap-3">
                {(['comply', 'fix'] as const).map((p) => (
                  <label
                    key={p}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all duration-150 text-center ${
                      plan === p
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p}
                      checked={plan === p}
                      onChange={() => setPlan(p)}
                      className="sr-only"
                    />
                    <span className="font-body text-sm font-semibold text-ink block">
                      {p === 'comply' ? 'Comply' : 'Fix'}
                    </span>
                    <span className={`font-display text-lg font-bold ${plan === p ? 'text-emerald-600' : 'text-ink'}`}>
                      {p === 'comply' ? '$299' : '$599'}
                    </span>
                    <span className="font-body text-xs text-slate-600 block">/year</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="poNumber" className="label">
                PO number <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                id="poNumber"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="input"
                placeholder="PO-2026-001234"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending invoice&hellip;
                </>
              ) : (
                'Request invoice'
              )}
            </button>

            <p className="text-center font-body text-xs text-slate-600">
              A NET-30 invoice will be emailed to the billing contact. Your account activates once payment is received.
            </p>
          </form>

          <p className="mt-6 text-center font-body text-sm text-slate-600">
            Prefer to pay by card?{' '}
            <Link href={`/signup?plan=${plan}`} className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign up with card payment
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/invoice-request/page.tsx
git commit -m "feat: add invoice request form page at /invoice-request"
```

---

### Task 9: Update dashboard settings — page budget usage display

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Modify: `src/app/api/sites/route.ts`

The spec requires showing "142 / 500 pages used" instead of just "Up to 500 pages." This requires fetching actual page counts from the most recent scan.

- [ ] **Step 1: Add pagesUsed to sites API response**

In `src/app/api/sites/route.ts`, update the GET handler to include pages scanned in the most recent completed scan. After the existing `sites` query, add a pages-used lookup.

Find the line where sites are returned in the GET handler and update the query to include the latest scan's `pagesScanned`:

```typescript
const sites = await prisma.site.findMany({
  where: { organizationId: session.user.organizationId },
  select: {
    id: true,
    url: true,
    cmsType: true,
    maxPages: true,
    scans: {
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 1,
      select: { pagesScanned: true },
    },
  },
});

const sitesWithUsage = sites.map((s) => ({
  id: s.id,
  url: s.url,
  cmsType: s.cmsType,
  maxPages: s.maxPages,
  pagesUsed: s.scans[0]?.pagesScanned ?? 0,
}));
```

Return `sitesWithUsage` instead of `sites` in the response.

- [ ] **Step 2: Update settings page to show page budget usage**

In `src/app/(dashboard)/settings/page.tsx`, update the `SiteInfo` interface to include `pagesUsed`:

```typescript
interface SiteInfo {
  id: string;
  url: string;
  cmsType: string;
  maxPages: number;
  pagesUsed: number;
}
```

Then update the display text at line 113-114, replacing:

```tsx
<p className="text-xs font-body text-slate-600">
  Up to {site.maxPages.toLocaleString()} pages
</p>
```

With:

```tsx
<p className="text-xs font-body text-slate-600">
  {site.pagesUsed.toLocaleString()} / {site.maxPages.toLocaleString()} pages used
</p>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sites/route.ts src/app/(dashboard)/settings/page.tsx
git commit -m "feat: show page budget usage (X / Y pages used) in settings"
```

---

### Task 10: Update CLAUDE.md tier table

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the tier table**

In `CLAUDE.md`, replace the `## Tiers` section with:

```markdown
## Tiers

| | Scan ($99/yr) | Comply ($299/yr) | Fix ($599/yr) |
|---|---|---|---|
| Pages | 100 | 500 | 2,000 |
| Sites | 1 | Unlimited | Unlimited |
| Frequency | Monthly | Weekly | Weekly |
| On-demand | 2/mo | 5/mo | Unlimited |
| AI fix suggestions | No | No | Yes |
| PO / invoice | No | Yes | Yes |

Manage tier: "Contact us" placeholder (no self-serve yet).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md tier table with unlimited sites, AI fix, PO flags"
```
