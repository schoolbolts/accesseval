import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export { getStripe as stripe };

export const PRICE_IDS: Record<string, string> = {
  scan: process.env.STRIPE_PRICE_SCAN || '',
  comply: process.env.STRIPE_PRICE_COMPLY || '',
  fix: process.env.STRIPE_PRICE_FIX || '',
};

export async function createCheckoutSession(params: {
  customerId: string; priceId: string; successUrl: string; cancelUrl: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}
