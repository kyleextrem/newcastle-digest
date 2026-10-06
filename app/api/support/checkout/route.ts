/**
 * POST /api/support/checkout
 * Creates a one-time AUD Checkout Session for a reader contribution.
 * Separate from the Work With Us payment links. Does not create a Product or a recurring Price.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createSupportCheckout, getSupportProductId } from '@/lib/support-checkout';
import { getStripe } from '@/lib/stripe';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(contentLength) || contentLength > 1024) {
    return json({ error: 'Enter a valid amount in Australian dollars.' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Enter a valid amount in Australian dollars.' }, 400);
  }

  const amount =
    body && typeof body === 'object' && !Array.isArray(body) && 'amount' in body
      ? body.amount
      : undefined;

  const result = await createSupportCheckout({
    amount,
    productId: getSupportProductId(),
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
    createSession: async (params) => {
      const session = await getStripe().checkout.sessions.create(params);
      return { url: session.url };
    },
  });

  return json(result.body, result.status);
}

function json(body: { url: string } | { error: string }, status: number) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
