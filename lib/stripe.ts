import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured');
  }

  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: '2026-09-30.endive',
      typescript: true,
    });
  }

  return stripe;
}
