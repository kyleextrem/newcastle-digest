export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { expireOpenShopSession } from '@/lib/shop-checkout-flow';
import { cancelShopCheckout, listExpiredActiveCheckouts } from '@/lib/shop-checkout-order';
import { logShopDatabaseError } from '@/lib/shop-log';
import { getStripe } from '@/lib/stripe';
import { shopStripeKeyMode } from '@/lib/shop-checkout';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const due = await listExpiredActiveCheckouts();
  let released = 0;
  for (const row of due) {
    try {
      if (row.sessionId) {
        if (shopStripeKeyMode(process.env.STRIPE_SECRET_KEY) === 'unknown') {
          continue;
        }
        const session = await getStripe().checkout.sessions.retrieve(row.sessionId);
        if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
          continue;
        }
        await expireOpenShopSession(row.sessionId);
      }
      await cancelShopCheckout(row.orderId, 'expired');
      released += 1;
    } catch (error) {
      logShopDatabaseError('Shop reservation expiry failed', error);
    }
  }

  return Response.json({ ok: true, released });
}
