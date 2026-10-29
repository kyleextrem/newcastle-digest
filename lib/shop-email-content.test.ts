import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_SHOP_EMAIL_FROM,
  buildShopOrderEmail,
  isShopEmailConfigured,
  shopEmailFromAddress,
  shopEmailRecipient,
  shopOrderIsConfirmedPaid,
  shopTrackingLabel,
  shopTrackingUrl,
} from './shop-email-content';

const order = {
  orderNumber: 1014,
  customerName: 'Alex Reader',
  lines: [
    { name: 'Market Tote', quantity: 2, unitPriceCents: 2500 },
    { name: 'Pin — Navy', quantity: 1, unitPriceCents: 800 },
  ],
  shippingCents: 500,
  totalCents: 5800,
  address: {
    name: 'Alex Reader',
    line1: '12 Hunter Street',
    line2: '',
    city: 'Newcastle',
    state: 'NSW',
    postcode: '2300',
    country: 'AU',
  },
  carrier: 'Australia Post',
  trackingNumber: 'ABC123',
};

describe('shop email content', () => {
  it('sends only for confirmed paid orders', () => {
    assert.equal(shopOrderIsConfirmedPaid('paid', 'paid'), true);
    assert.equal(shopOrderIsConfirmedPaid('fulfilled', 'paid'), true);
    assert.equal(shopOrderIsConfirmedPaid('partially_refunded', 'partially_refunded'), true);
    assert.equal(shopOrderIsConfirmedPaid('pending', 'pending'), false);
    assert.equal(shopOrderIsConfirmedPaid('pending', 'paid'), false);
    assert.equal(shopOrderIsConfirmedPaid('paid', 'pending'), false);
    assert.equal(shopOrderIsConfirmedPaid('cancelled', 'failed'), false);
    assert.equal(shopOrderIsConfirmedPaid('paid', null), false);
  });

  it('rejects placeholder checkout recipients', () => {
    assert.equal(shopEmailRecipient('alex@example.com'), 'alex@example.com');
    assert.equal(shopEmailRecipient('Alex@Example.com'), 'alex@example.com');
    assert.equal(
      shopEmailRecipient('pending.abc123@checkout.newcastledigest.com'),
      null,
    );
    assert.equal(shopEmailRecipient('not-an-email'), null);
  });

  it('reuses the Digest Resend from address and reports missing API keys', () => {
    assert.equal(shopEmailFromAddress({}), DEFAULT_SHOP_EMAIL_FROM);
    assert.equal(
      shopEmailFromAddress({ SHOP_EMAIL_FROM: 'Shop <shop@newcastledigest.com>' }),
      'Shop <shop@newcastledigest.com>',
    );
    assert.equal(isShopEmailConfigured({}), false);
    assert.equal(isShopEmailConfigured({ RESEND_API_KEY: 're_test' }), true);
  });

  it('only treats http(s) values as tracking links', () => {
    assert.equal(shopTrackingUrl('ABC123'), null);
    assert.equal(shopTrackingUrl('Not recorded'), null);
    assert.equal(
      shopTrackingUrl('https://auspost.com.au/mypost/track/#/details/ABC123'),
      'https://auspost.com.au/mypost/track/#/details/ABC123',
    );
    assert.equal(shopTrackingLabel('Not recorded'), null);
    assert.equal(shopTrackingLabel('ABC123'), 'ABC123');
  });

  it('includes order items, $5 shipping, total and address', () => {
    const email = buildShopOrderEmail('order_confirmation', order);
    assert.match(email.subject, /Order 1014 confirmed/);
    assert.match(email.text, /Market Tote × 2 — \$50\.00/);
    assert.match(email.text, /Pin — Navy × 1 — \$8\.00/);
    assert.match(email.text, /Shipping to Australia: \$5\.00/);
    assert.match(email.text, /Total paid: \$58\.00/);
    assert.match(email.text, /12 Hunter Street/);
    assert.match(email.html, /Qty 2/);
    assert.match(email.html, /Delivering to/);
    assert.equal(email.html.includes('Track this parcel'), false);
  });

  it('includes carrier details and a tracking button only for valid URLs', () => {
    const withCode = buildShopOrderEmail('dispatch', order);
    assert.match(withCode.subject, /Order 1014 has shipped/);
    assert.match(withCode.text, /Carrier: Australia Post/);
    assert.match(withCode.text, /Tracking: ABC123/);
    assert.equal(withCode.text.includes('Track this parcel'), false);
    assert.equal(withCode.html.includes('Track this parcel'), false);

    const withUrl = buildShopOrderEmail('dispatch', {
      ...order,
      trackingNumber: 'https://auspost.com.au/mypost/track/#/details/ABC123',
    });
    assert.match(withUrl.text, /Track this parcel: https:\/\/auspost.com.au\/mypost\/track\/#\/details\/ABC123/);
    assert.match(withUrl.html, /Track this parcel/);
    assert.match(withUrl.html, /href="https:\/\/auspost.com.au\/mypost\/track\/#\/details\/ABC123"/);
  });
});
