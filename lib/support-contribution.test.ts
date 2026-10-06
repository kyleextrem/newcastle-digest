import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SITE_URL } from './site';
import { parseContributionAmount } from './support-contribution';
import {
  buildSupportCheckoutParams,
  createSupportCheckout,
  isConfirmedSupportSession,
  isStripeHostedCheckoutUrl,
} from './support-checkout';

describe('parseContributionAmount', () => {
  it('converts normal decimal amounts to integer cents', () => {
    assert.deepEqual(parseContributionAmount('10.00'), { ok: true, cents: 1000, amount: '10.00' });
    assert.deepEqual(parseContributionAmount('10.10'), { ok: true, cents: 1010, amount: '10.10' });
    assert.deepEqual(parseContributionAmount('1.1'), { ok: true, cents: 110, amount: '1.10' });
    assert.deepEqual(parseContributionAmount('1'), { ok: true, cents: 100, amount: '1.00' });
    assert.deepEqual(parseContributionAmount(' 25.5 '), { ok: true, cents: 2550, amount: '25.50' });
    assert.deepEqual(parseContributionAmount('999999.99'), {
      ok: true,
      cents: 99_999_999,
      amount: '999999.99',
    });
  });

  it('rejects zero, negative, non-numeric, and extreme values', () => {
    for (const value of [
      '',
      ' ',
      '0',
      '0.00',
      '0.99',
      '-1',
      '-10.00',
      'NaN',
      'Infinity',
      '-Infinity',
      '1e2',
      '10.555',
      '10.',
      '.5',
      '01.00',
      '$10',
      '10,00',
      'abc',
      '1.2.3',
    ]) {
      const result = parseContributionAmount(value);
      assert.equal(result.ok, false, `expected ${JSON.stringify(value)} to be rejected`);
    }

    for (const value of [null, undefined, 10, 10.5, Number.NaN, Number.POSITIVE_INFINITY, true, {}, []]) {
      assert.equal(parseContributionAmount(value).ok, false);
    }

    assert.equal(parseContributionAmount('1000000').ok, false);
    assert.equal(parseContributionAmount('1000000.00').ok, false);
  });
});

describe('buildSupportCheckoutParams', () => {
  it('forces a one-time AUD checkout for the submitted amount', () => {
    const params = buildSupportCheckoutParams(2550, 'prod_Support123', '25.50');

    const submitText = params.custom_text?.submit;
    const submitMessage = submitText && typeof submitText === 'object' ? submitText.message : undefined;
    assert.equal(params.mode, 'payment');
    assert.equal(params.currency, 'aud');
    assert.equal(submitMessage, 'One-time contribution to Newcastle Digest.');
    assert.equal(params.submit_type, undefined);
    assert.equal(params.success_url, `${SITE_URL}/support/success?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(params.cancel_url, `${SITE_URL}/support?amount=25.50`);
    assert.equal(params.success_url?.includes('localhost'), false);
    assert.equal(params.cancel_url?.includes('vercel'), false);
    assert.equal('payment_method_types' in params, false);
    assert.equal(params.line_items?.length, 1);

    const item = params.line_items?.[0];
    assert.equal(item?.quantity, 1);
    assert.equal(item?.price_data?.currency, 'aud');
    assert.equal(item?.price_data?.unit_amount, 2550);
    assert.equal(item?.price_data?.product, 'prod_Support123');
    assert.equal(item?.price_data?.product_data, undefined);
    assert.equal(item?.price_data?.recurring, undefined);
    assert.equal(JSON.stringify(params).includes('recurring'), false);
  });
});

describe('createSupportCheckout', () => {
  it('does not call Stripe for an invalid amount', async () => {
    let called = false;
    const result = await createSupportCheckout({
      amount: '0',
      productId: 'prod_Support123',
      configured: true,
      createSession: async () => {
        called = true;
        return { url: 'https://checkout.stripe.com/c/pay/cs_test_123' };
      },
    });

    assert.equal(called, false);
    assert.equal(result.status, 400);
  });

  it('sends the validated cents amount in AUD and returns only a Stripe Checkout URL', async () => {
    let receivedUnitAmount: number | undefined;
    let receivedCurrency: string | undefined;
    const result = await createSupportCheckout({
      amount: '18.25',
      productId: 'prod_Support123',
      configured: true,
      createSession: async (params) => {
        receivedUnitAmount = params.line_items?.[0]?.price_data?.unit_amount;
        receivedCurrency = params.line_items?.[0]?.price_data?.currency;
        assert.equal(params.mode, 'payment');
        assert.equal(params.currency, 'aud');
        return { url: 'https://checkout.stripe.com/c/pay/cs_test_abc' };
      },
    });

    assert.equal(receivedUnitAmount, 1825);
    assert.equal(receivedCurrency, 'aud');
    assert.deepEqual(result, {
      status: 200,
      body: { url: 'https://checkout.stripe.com/c/pay/cs_test_abc' },
    });
  });

  it('does not return a non-Stripe redirect', async () => {
    const result = await createSupportCheckout({
      amount: '10.00',
      productId: 'prod_Support123',
      configured: true,
      createSession: async () => ({ url: 'https://example.com/phish' }),
    });

    assert.equal(result.status, 502);
    assert.equal('url' in result.body, false);
    assert.equal(isStripeHostedCheckoutUrl('https://example.com/phish'), false);
    assert.equal(isStripeHostedCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_abc'), true);
  });

  it('does not call Stripe when the server is not configured', async () => {
    let called = false;
    const result = await createSupportCheckout({
      amount: '10.00',
      productId: null,
      configured: false,
      createSession: async () => {
        called = true;
        return { url: null };
      },
    });

    assert.equal(called, false);
    assert.equal(result.status, 503);
  });
});

describe('isConfirmedSupportSession', () => {
  const paid = {
    mode: 'payment',
    currency: 'aud',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 1000,
    metadata: { purpose: 'support_contribution' },
  };

  it('accepts a paid one-time AUD support session', () => {
    assert.equal(isConfirmedSupportSession(paid), true);
  });

  it('rejects an unpaid or unrelated session', () => {
    assert.equal(isConfirmedSupportSession({ ...paid, payment_status: 'unpaid' }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, status: 'open' }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, currency: 'usd' }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, mode: 'subscription' }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, metadata: null }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, metadata: { purpose: 'other' } }), false);
    assert.equal(isConfirmedSupportSession({ ...paid, amount_total: 0 }), false);
  });
});
