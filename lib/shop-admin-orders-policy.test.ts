import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AdminInputError } from './shop-admin-policy';
import {
  adminFulfilmentStatus,
  orderStatusAfterRefund,
  orderStatusAfterShipment,
  parseRefundAmountCents,
  paymentStatusAfterRefund,
  remainingRefundCents,
  refundIdempotencyKey,
} from './shop-admin-orders-policy';

describe('shop admin refund amounts', () => {
  it('keeps remaining refunds inside the paid total', () => {
    assert.equal(remainingRefundCents(3500, 0), 3500);
    assert.equal(remainingRefundCents(3500, 1500), 2000);
    assert.equal(remainingRefundCents(3500, 3500), 0);
    assert.equal(paymentStatusAfterRefund(3500, 1500), 'partially_refunded');
    assert.equal(paymentStatusAfterRefund(3500, 3500), 'refunded');
    assert.equal(orderStatusAfterRefund('partially_refunded'), 'partially_refunded');
    assert.equal(orderStatusAfterRefund('refunded'), 'refunded');
    assert.equal(parseRefundAmountCents('remaining', 3500), 3500);
    assert.equal(parseRefundAmountCents('12.50', 3500), 1250);
    assert.throws(() => parseRefundAmountCents('40.00', 3500), AdminInputError);
    assert.throws(() => parseRefundAmountCents('0', 3500), AdminInputError);
    assert.equal(refundIdempotencyKey('pay', 0, 3500), 'shop-refund-pay-0-3500');
  });
});

describe('shop admin fulfilment', () => {
  it('labels packed and shipped quantities without treating packing as shipped', () => {
    assert.equal(adminFulfilmentStatus({ orderedQuantity: 2, packedQuantity: 0, shippedQuantity: 0 }), 'unfulfilled');
    assert.equal(adminFulfilmentStatus({ orderedQuantity: 2, packedQuantity: 2, shippedQuantity: 0 }), 'packed');
    assert.equal(adminFulfilmentStatus({ orderedQuantity: 2, packedQuantity: 0, shippedQuantity: 1 }), 'partially_shipped');
    assert.equal(adminFulfilmentStatus({ orderedQuantity: 2, packedQuantity: 0, shippedQuantity: 2 }), 'shipped');
    assert.equal(orderStatusAfterShipment('paid', true), 'fulfilled');
    assert.equal(orderStatusAfterShipment('paid', false), 'partially_fulfilled');
    assert.equal(orderStatusAfterShipment('refunded', true), 'refunded');
  });
});
