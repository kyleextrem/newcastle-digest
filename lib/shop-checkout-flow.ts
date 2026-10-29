import 'server-only';

import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  SHOP_ORDER_PURPOSE,
  SHOP_RESERVATION_TTL_SECONDS,
  ShopCheckoutError,
  buildShopCheckoutParams,
  isShopCheckoutConfigured,
  isStripeHostedCheckoutUrl,
  parseCheckoutCart,
  shopSessionMatchesConfiguredMode,
  shopStripeEventAction,
  snapshotCheckoutSession,
} from '@/lib/shop-checkout';
import {
  attachShopCheckoutSession,
  cancelShopCheckout,
  cancelShopCheckoutWithSql,
  claimShopWebhookEvent,
  fulfillShopSessionWithSql,
  markShopWebhookFailed,
  markShopWebhookProcessed,
  reserveShopCart,
} from '@/lib/shop-checkout-order';
import { transaction } from '@/lib/db';
import { sendShopOrderConfirmation } from '@/lib/shop-email';
import { logShopDatabaseError } from '@/lib/shop-log';

export async function startShopCheckout(cart: unknown, origin: string): Promise<{ url: string }> {
  const items = parseCheckoutCart(cart);
  if (
    !isShopCheckoutConfigured({
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    })
  ) {
    throw new ShopCheckoutError('Checkout is not available yet.');
  }
  const reserved = await reserveShopCart(items);
  let session: Stripe.Checkout.Session | null = null;

  try {
    session = await getStripe().checkout.sessions.create(
      buildShopCheckoutParams({
        origin,
        orderId: reserved.orderId,
        lines: reserved.lines,
        expiresAtUnix: Math.floor(Date.now() / 1000) + SHOP_RESERVATION_TTL_SECONDS,
      }),
      { idempotencyKey: `shop-order-${reserved.orderId}` },
    );
    if (!isStripeHostedCheckoutUrl(session.url)) {
      throw new ShopCheckoutError('The shop could not start checkout. Try again.');
    }
    await attachShopCheckoutSession({
      orderId: reserved.orderId,
      sessionId: session.id,
      expiresAt: new Date(session.expires_at * 1000),
    });
    return { url: session.url };
  } catch (error) {
    if (session?.id) {
      await getStripe().checkout.sessions.expire(session.id).catch(() => undefined);
    }
    await cancelShopCheckout(reserved.orderId, 'released').catch((releaseError) => {
      logShopDatabaseError('Shop checkout could not release a failed attempt', releaseError);
    });
    throw error;
  }
}

export async function processShopStripeEvent(event: Stripe.Event): Promise<void> {
  const snapshot = await snapshotFromEvent(event);
  if (!snapshot || snapshot.purpose !== SHOP_ORDER_PURPOSE) {
    return;
  }

  const action = shopStripeEventAction(event.type, snapshot.paymentStatus);
  if (action === 'ignore') {
    return;
  }

  const confirmation = {
    orderId: '',
    createIfMissing: false,
    ready: false,
  };
  try {
    await transaction(async (sql) => {
      const claim = await claimShopWebhookEvent(sql, event.id, event.type);
      if (claim === 'duplicate') {
        if (action === 'fulfill' && snapshot.orderId) {
          confirmation.orderId = snapshot.orderId;
          confirmation.createIfMissing = false;
          confirmation.ready = true;
        }
        return;
      }
      if (!shopSessionMatchesConfiguredMode(snapshot.livemode, process.env.STRIPE_SECRET_KEY)) {
        throw new ShopCheckoutError('That payment does not match the shop Stripe mode.');
      }
      if (!snapshot.orderId) {
        throw new ShopCheckoutError('That checkout is missing its order.');
      }
      if (action === 'fulfill') {
        confirmation.orderId = snapshot.orderId;
        confirmation.createIfMissing = await fulfillShopSessionWithSql(sql, snapshot);
        confirmation.ready = true;
      } else {
        await cancelShopCheckoutWithSql(
          sql,
          snapshot.orderId,
          event.type === 'checkout.session.expired' ? 'expired' : 'released',
        );
      }
      await markShopWebhookProcessed(sql, event.id, event.type);
    });
  } catch (error) {
    logShopDatabaseError('Shop Stripe webhook failed', error);
    await markShopWebhookFailed(
      event.id,
      event.type,
      error instanceof Error ? error.message : 'Webhook handling failed',
    );
    throw error;
  }

  if (confirmation.ready) {
    await sendShopOrderConfirmation(confirmation.orderId, confirmation.createIfMissing);
  }
}

export async function expireOpenShopSession(sessionId: string): Promise<void> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.status === 'open') {
      await getStripe().checkout.sessions.expire(sessionId);
    }
  } catch (error) {
    logShopDatabaseError('Shop checkout session expire failed', error);
  }
}

async function snapshotFromEvent(event: Stripe.Event): Promise<ReturnType<typeof snapshotCheckoutSession> | null> {
  if (event.type.startsWith('checkout.session.')) {
    return snapshotCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }
  if (event.type !== 'payment_intent.succeeded') {
    return null;
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const metadata = intent.metadata ?? {};
  if (metadata.purpose !== SHOP_ORDER_PURPOSE) {
    return null;
  }

  const listed = await getStripe().checkout.sessions.list({
    payment_intent: intent.id,
    limit: 1,
  });
  return listed.data[0] ? snapshotCheckoutSession(listed.data[0]) : null;
}
