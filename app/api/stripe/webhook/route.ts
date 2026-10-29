export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { processShopStripeEvent } from '@/lib/shop-checkout-flow';
import { logShopDatabaseError } from '@/lib/shop-log';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return new Response('Webhook is not configured', { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing Stripe signature', { status: 400 });
  }

  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response('Invalid Stripe signature', { status: 400 });
  }

  try {
    await processShopStripeEvent(event);
    return new Response(null, { status: 200 });
  } catch (error) {
    logShopDatabaseError('Shop Stripe webhook rejected', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
