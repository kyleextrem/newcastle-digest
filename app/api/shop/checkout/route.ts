export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { checkoutOriginFromRequest, isStripeHostedCheckoutUrl, ShopCheckoutError } from '@/lib/shop-checkout';
import { startShopCheckout } from '@/lib/shop-checkout-flow';
import { logShopDatabaseError } from '@/lib/shop-log';
import { SITE_URL } from '@/lib/site';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(contentLength) || contentLength > 16_384) {
    return json({ error: 'Your cart could not be read.' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Your cart could not be read.' }, 400);
  }

  try {
    const result = await startShopCheckout(body, checkoutOriginFromRequest(request, SITE_URL));
    if (!isStripeHostedCheckoutUrl(result.url)) {
      return json({ error: 'The shop could not start checkout. Try again.' }, 502);
    }
    return json({ url: result.url }, 200);
  } catch (error) {
    if (error instanceof ShopCheckoutError) {
      return json({ error: error.message }, error.message === 'Checkout is not available yet.' ? 503 : 400);
    }
    logShopDatabaseError('Shop checkout start failed', error);
    return json({ error: 'The shop could not start checkout. Try again.' }, 502);
  }
}

function json(body: { url: string } | { error: string }, status: number) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
