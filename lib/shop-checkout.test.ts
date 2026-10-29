import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SHOP_FLAT_SHIPPING_CENTS,
  SHOP_ORDER_PURPOSE,
  ShopCheckoutError,
  assertFulfillableShopSession,
  buildShopCheckoutParams,
  checkoutOriginFromRequest,
  isShopCheckoutConfigured,
  orderTotals,
  parseCheckoutCart,
  pendingCustomerEmail,
  shippingCentsForLines,
  shopPaymentsAreTestMode,
  shopSessionMatchesConfiguredMode,
  shopOrderIsPaidStatus,
  shopStripeEventAction,
  shopStripeKeyMode,
} from './shop-checkout';

const productId = '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b';
const variantId = '7a2b9d3c-2c4e-4f60-9b0c-1d2e3f4a5b6c';

describe('shop checkout pricing', () => {
  it('charges $5 only when a physical item is in the order', () => {
    assert.equal(shippingCentsForLines([{ requiresShipping: false }]), 0);
    assert.equal(shippingCentsForLines([{ requiresShipping: true }, { requiresShipping: false }]), SHOP_FLAT_SHIPPING_CENTS);
    assert.deepEqual(
      orderTotals([
        { quantity: 2, unitPriceCents: 1800, requiresShipping: true },
        { quantity: 1, unitPriceCents: 500, requiresShipping: false },
      ]),
      { subtotalCents: 4100, shippingCents: 500, totalCents: 4600 },
    );
  });

  it('ignores client prices and keeps only ids and quantities', () => {
    const items = parseCheckoutCart({
      version: 1,
      items: [{ productId, variantId: null, quantity: 2, priceCents: 1 }],
    });
    assert.deepEqual(items, [{ productId, variantId: null, quantity: 2 }]);
    assert.throws(() => parseCheckoutCart({ version: 1, items: [] }), ShopCheckoutError);
  });

  it('adds Australian shipping collection only for physical orders', () => {
    const physical = buildShopCheckoutParams({
      origin: 'http://localhost:3004',
      orderId: productId,
      expiresAtUnix: 1_700_000_000,
      lines: [
        {
          productId,
          variantId,
          productName: 'Tote',
          variantName: 'Navy',
          sku: 'TOTE-N',
          quantity: 1,
          unitPriceCents: 1800,
          requiresShipping: true,
          inventoryId: productId,
          onHand: 4,
          reserved: 0,
        },
      ],
    });
    assert.equal(physical.currency, 'aud');
    assert.deepEqual(physical.shipping_address_collection?.allowed_countries, ['AU']);
    assert.equal(physical.shipping_options?.length, 1);
    assert.equal(physical.metadata?.purpose, SHOP_ORDER_PURPOSE);
    assert.equal('payment_method_types' in physical, false);

    const digital = buildShopCheckoutParams({
      origin: 'http://localhost:3004',
      orderId: productId,
      expiresAtUnix: 1_700_000_000,
      lines: [
        {
          productId,
          variantId: null,
          productName: 'PDF',
          variantName: '',
          sku: 'PDF-1',
          quantity: 1,
          unitPriceCents: 900,
          requiresShipping: false,
          inventoryId: productId,
          onHand: 4,
          reserved: 0,
        },
      ],
    });
    assert.equal(digital.shipping_address_collection, undefined);
    assert.equal(digital.shipping_options, undefined);
  });
});

describe('shop Stripe event routing', () => {
  it('fulfills paid sessions once and ignores unpaid completed sessions', () => {
    assert.equal(shopStripeEventAction('checkout.session.completed', 'unpaid'), 'ignore');
    assert.equal(shopStripeEventAction('checkout.session.completed', 'paid'), 'fulfill');
    assert.equal(shopStripeEventAction('checkout.session.async_payment_succeeded', 'paid'), 'fulfill');
    assert.equal(shopStripeEventAction('checkout.session.expired', 'unpaid'), 'cancel');
    assert.equal(shopStripeEventAction('checkout.session.async_payment_failed', 'unpaid'), 'cancel');
    assert.equal(shopStripeEventAction('payment_intent.succeeded', 'paid'), 'fulfill');
    assert.equal(shopStripeEventAction('charge.succeeded', 'paid'), 'ignore');
    assert.doesNotThrow(() =>
      assertFulfillableShopSession(
        {
          id: 'cs_live_12345678',
          livemode: true,
          mode: 'payment',
          currency: 'aud',
          status: 'complete',
          paymentStatus: 'paid',
          amountTotal: 3500,
          paymentIntentId: 'pi_live_12345678',
          orderId: productId,
          purpose: SHOP_ORDER_PURPOSE,
          shippingAmount: 500,
          customer: null,
        },
        3500,
      ),
    );
  });

  it('allows live or test keys only when a webhook secret is set', () => {
    assert.equal(shopStripeKeyMode('sk_live_123'), 'live');
    assert.equal(shopPaymentsAreTestMode('sk_test_123'), true);
    assert.equal(shopPaymentsAreTestMode('rk_test_123'), true);
    assert.equal(shopPaymentsAreTestMode('sk_live_123'), false);
    assert.equal(shopSessionMatchesConfiguredMode(true, 'sk_live_123'), true);
    assert.equal(shopSessionMatchesConfiguredMode(false, 'sk_live_123'), false);
    assert.equal(shopSessionMatchesConfiguredMode(false, 'sk_test_123'), true);
    assert.equal(
      isShopCheckoutConfigured({
        STRIPE_SECRET_KEY: 'sk_live_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
      }),
      true,
    );
    assert.equal(
      isShopCheckoutConfigured({
        STRIPE_SECRET_KEY: 'sk_live_123',
        STRIPE_WEBHOOK_SECRET: '',
      }),
      false,
    );
    assert.equal(
      isShopCheckoutConfigured({
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
      }),
      true,
    );
    assert.match(pendingCustomerEmail(productId), /^pending\.[a-f0-9]+@checkout\.newcastledigest\.com$/);
    assert.equal(
      checkoutOriginFromRequest(
        new Request('http://127.0.0.1:3004/api/shop/checkout', {
          headers: { host: '127.0.0.1:3004' },
        }),
        'https://newcastledigest.com',
      ),
      'http://127.0.0.1:3004',
    );
    assert.equal(shopOrderIsPaidStatus('paid'), true);
    assert.equal(shopOrderIsPaidStatus('fulfilled'), true);
    assert.equal(shopOrderIsPaidStatus('pending'), false);
    assert.equal(shopOrderIsPaidStatus('cancelled'), false);
  });

  it('keeps production Stripe return URLs on the public site, not the Vercel hostname', () => {
    const previousEnv = process.env.VERCEL_ENV;
    const previousUrl = process.env.VERCEL_URL;
    const previousOrigin = process.env.SHOP_CHECKOUT_ORIGIN;
    const request = new Request('https://newcastle-digest.vercel.app/api/shop/checkout', {
      headers: {
        host: 'newcastle-digest.vercel.app',
        'x-forwarded-host': 'www.newcastledigest.com',
      },
    });
    try {
      delete process.env.SHOP_CHECKOUT_ORIGIN;
      process.env.VERCEL_ENV = 'production';
      process.env.VERCEL_URL = 'newcastle-digest.vercel.app';
      assert.equal(checkoutOriginFromRequest(request, 'https://www.newcastledigest.com'), 'https://www.newcastledigest.com');

      process.env.VERCEL_ENV = 'preview';
      assert.equal(
        checkoutOriginFromRequest(request, 'https://www.newcastledigest.com'),
        'https://newcastle-digest.vercel.app',
      );
    } finally {
      if (previousEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = previousEnv;
      }
      if (previousUrl === undefined) {
        delete process.env.VERCEL_URL;
      } else {
        process.env.VERCEL_URL = previousUrl;
      }
      if (previousOrigin === undefined) {
        delete process.env.SHOP_CHECKOUT_ORIGIN;
      } else {
        process.env.SHOP_CHECKOUT_ORIGIN = previousOrigin;
      }
    }
  });
});
