import { NextRequest, NextResponse } from 'next/server';
import { stripe as getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { PLAN_LIMITS, PlanName } from '@/lib/plan-limits';
import { notifyPaymentFailed } from '../../../../worker/notifier';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event: import('stripe').Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id;
        if (customerId) {
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId },
            data: { planStatus: 'active' },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as import('stripe').Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        // Determine plan from price metadata or lookup price id
        const priceId = subscription.items.data[0]?.price.id;
        const planEntry = priceId
          ? Object.entries({
              scan: process.env.STRIPE_PRICE_SCAN || '',
              comply: process.env.STRIPE_PRICE_COMPLY || '',
              fix: process.env.STRIPE_PRICE_FIX || '',
            }).find(([, pid]) => pid === priceId)
          : undefined;

        const newPlan = planEntry ? (planEntry[0] as PlanName) : undefined;
        const maxPages = newPlan ? PLAN_LIMITS[newPlan].maxPages : undefined;

        const rawStatus = subscription.status;
        // Map Stripe statuses to our PlanStatus enum
        const planStatusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled'> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          incomplete: 'past_due',
          incomplete_expired: 'canceled',
          unpaid: 'past_due',
          paused: 'active',
        };
        const planStatus = planStatusMap[rawStatus] ?? 'active';

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            ...(newPlan ? { plan: newPlan } : {}),
            planStatus,
          },
        });

        // Update maxPages on the site if plan changed
        if (newPlan && maxPages !== undefined) {
          const org = await prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });
          if (org) {
            await prisma.site.updateMany({
              where: { organizationId: org.id },
              data: { maxPages },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as import('stripe').Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { planStatus: 'canceled' },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId },
            data: { planStatus: 'past_due' },
          });
          await notifyPaymentFailed(customerId);
        }
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error handling Stripe event ${event.type}:`, message);
    return NextResponse.json({ error: 'Webhook handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
