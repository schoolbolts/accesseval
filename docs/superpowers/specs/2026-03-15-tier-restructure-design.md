# Tier Restructure & PO Invoicing — Design Spec

## Goal

Restructure AccessEval's pricing tiers from site-limited to page-budget model with unlimited sites, add AI fix suggestions as a Fix tier feature gate, and add PO/invoice payment for Comply ($299) and above.

## Background

Current model: 3 tiers with per-site limits (1/3/5 sites). This creates friction for K-12 districts that have many subdomains (10+ school subsites under one district). Switching to a page budget with unlimited sites removes this friction and aligns pricing with actual cost (pages scanned = compute used).

Additionally, schools and governments purchasing above ~$300 typically require purchase orders and invoicing rather than credit card payment. Adding Stripe Invoicing as a payment option unlocks this market segment.

## New Tier Structure

| | Scan ($99/yr) | Comply ($299/yr) | Fix ($599/yr) |
|---|---|---|---|
| **Pages** | 100 | 500 | 2,000 |
| **Sites** | 1 | Unlimited | Unlimited |
| **Scanning** | Monthly | Weekly | Weekly |
| **On-demand scans** | 2/mo | 5/mo | Unlimited |
| **Plain English issues** | All | All | All |
| **Issue tracking** | — | Yes | Yes |
| **Compliance docs** | — | Yes | Yes |
| **Weekly digest email** | — | Yes | Yes |
| **AI fix suggestions** | — | — | Yes |
| **CMS-specific fixes** | — | — | Yes |
| **Payment** | Card only | Card or PO/invoice | Card or PO/invoice |

**Manage tier ($1,500-2K):** Not included in this spec. Will be a "Contact us" button on the pricing page until the AI fix feature is live and service scope is validated.

### Changes from Current Model

| What | Before | After |
|---|---|---|
| Site limits | 1 / 3 / 5 | 1 / Unlimited / Unlimited |
| Page limits | 100 / 500 / 2,000 | Same (unchanged) |
| AI fix suggestions | N/A | Fix tier only |
| PO/invoice | Not available | Comply + Fix |
| Manage tier | N/A | "Contact us" placeholder |

## PO / Invoice Payment

### Flow

**Hybrid approach:** Stripe Checkout (card) remains the default. A "Need a PO or invoice?" link appears on the checkout page for Comply and Fix tiers, triggering the Stripe Invoicing flow.

**Card path (existing, unchanged):**
1. User clicks "Get started" → Stripe Checkout → pays with card → account activated immediately

**Invoice path (new):**
1. User clicks "Need a PO or invoice?" on pricing page
2. Form collects: organization name, billing contact email, billing address, PO number (optional), selected tier
3. Backend automatically creates a Stripe Invoice with NET-30 terms and sends it — no manual review step
4. Stripe emails the PDF invoice to the billing contact
5. Customer pays via ACH/bank transfer (details on invoice)
6. **Account activated on payment** — Stripe `invoice.paid` webhook triggers account activation
7. If unpaid after 60 days, invoice auto-voided and request cleaned up

**Account is not active until payment.** This means fake/spam invoice requests have zero cost — they just result in unpaid invoices that auto-expire. No manual review needed in the happy path. Stripe sends automatic payment reminders at day 15 and day 30.

### Stripe Configuration

- Enable Stripe Invoicing on the existing Stripe account
- Create invoice items matching existing Stripe products (Comply, Fix)
- Configure automatic payment reminders at day 15 and day 30
- Auto-void unpaid invoices after 60 days
- ACH/bank transfer payment method enabled on invoices

### PO Number Handling

The PO number is stored as metadata on the Stripe Invoice and in the `Organization` record. It appears on the PDF invoice for the customer's records. It's optional — some schools have POs, some don't need them for this amount.

## Plan Limits Changes

### `src/lib/plan-limits.ts`

```typescript
const PLAN_LIMITS = {
  scan: {
    maxPages: 100,
    maxSites: 1,              // unchanged
    scanFrequency: 'monthly',
    onDemandScansPerMonth: 2,
    features: {
      issueTracking: false,
      complianceDocs: false,
      weeklyDigest: false,
      cmsFixInstructions: false,
      aiFixSuggestions: false,     // new
      invoicePayment: false,       // new
    }
  },
  comply: {
    maxPages: 500,
    maxSites: Infinity,       // changed from 3
    scanFrequency: 'weekly',
    onDemandScansPerMonth: 5,
    features: {
      issueTracking: true,
      complianceDocs: true,
      weeklyDigest: true,
      cmsFixInstructions: false,
      aiFixSuggestions: false,
      invoicePayment: true,        // new
    }
  },
  fix: {
    maxPages: 2000,
    maxSites: Infinity,       // changed from 5
    scanFrequency: 'weekly',
    onDemandScansPerMonth: Infinity,
    features: {
      issueTracking: true,
      complianceDocs: true,
      weeklyDigest: true,
      cmsFixInstructions: true,
      aiFixSuggestions: true,      // new
      invoicePayment: true,        // new
    }
  }
}
```

### Site limit enforcement

Currently `maxSites` is checked when adding a site in the settings API. For Comply and Fix, this check becomes a no-op (Infinity). The Scan tier stays at 1 site. No structural change needed — just update the numbers.

## UI Changes

### Pricing page (`src/app/(public)/page.tsx`)

Update the pricing section:
- Change "X sites" to "Unlimited sites" for Comply and Fix
- Add "AI fix suggestions" row for Fix tier
- Add "PO / invoice available" badge on Comply and Fix tiers
- Add "Manage" column as a "Contact us" placeholder with key features listed
- Remove site count from feature comparison

### Pricing page — Manage tier placeholder

Fourth column on pricing table:
- Header: "Manage" with "Contact us" instead of a price
- Features: "Everything in Fix, plus: 30-day remediation, CMS access & direct fixes, PO/invoicing, Dedicated support"
- CTA: "Contact us" button → `mailto:hello@accesseval.com` or a simple contact form

### Signup page (`src/app/(public)/signup/page.tsx`)

Update plan comparison shown during signup to reflect new feature gates.

### Checkout flow

Add "Need a PO or invoice?" link below the Stripe Checkout button for Comply and Fix tiers. Links to a simple form page.

### Invoice request form (new page)

New page at `/invoice-request` with:
- Organization name
- Billing contact name + email
- Billing address
- Selected tier (Comply or Fix, pre-selected if coming from pricing page)
- PO number (optional)
- Submit button

On submit, calls an API route that creates the Stripe Invoice and sends it. Shows confirmation: "Invoice sent to {email}. Your account is now active."

### Dashboard settings

Show current plan's page budget usage: "142 / 500 pages used" instead of "2 / 3 sites used". The site count display is removed for Comply/Fix.

## API Changes

### New route: `src/app/api/invoices/request/route.ts`

Accepts the invoice request form data. Creates:
1. Organization + User (if not already signed up)
2. Stripe Customer
3. Stripe Invoice with the selected tier's price, NET-30 terms, PO metadata
4. Finalizes and sends the invoice via Stripe

Returns success. Account is immediately active.

### Existing route: `src/app/api/sites/route.ts`

Site creation already checks `maxSites`. No code change needed — just the config value changes to Infinity.

## Data Model

Add to `Organization` in `prisma/schema.prisma`:

```prisma
model Organization {
  // ...existing fields...
  poNumber    String?   @map("po_number")
  billingType String    @default("card") @map("billing_type")  // "card" | "invoice"
}
```

## Migration Path for Existing Customers

Existing customers on the old site-limited plans get the new unlimited sites automatically — it's a strict upgrade. No migration needed. Their Stripe subscriptions and prices stay the same.

## Files Affected

| File | Change |
|---|---|
| `src/lib/plan-limits.ts` | Update maxSites, add aiFixSuggestions + invoicePayment flags |
| `src/app/(public)/page.tsx` | Update pricing table (unlimited sites, AI fixes, PO badge, Manage placeholder) |
| `src/app/(public)/signup/page.tsx` | Update plan comparison |
| `src/app/(public)/invoice-request/page.tsx` | New page — invoice request form |
| `src/app/api/invoices/request/route.ts` | New route — create Stripe Invoice |
| `src/app/(dashboard)/settings/page.tsx` | Show page budget usage instead of site count |
| `prisma/schema.prisma` | Add poNumber, billingType to Organization |
| `CLAUDE.md` | Update tier table |
