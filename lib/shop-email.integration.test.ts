import Module from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { Pool } from 'pg';
import type { Sql } from './db';
import { SHOP_ORDER_PURPOSE, type ShopSessionSnapshot } from './shop-checkout';
import type * as ShopAdminOrders from './shop-admin-orders';
import type * as ShopCheckoutOrder from './shop-checkout-order';
import type * as ShopEmail from './shop-email';

const loaded = (Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown })._load.bind(
  Module,
);
(Module as unknown as { _load: typeof loaded })._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {};
  }
  return loaded(request, parent, isMain);
};

let deliverShopEmail: typeof ShopEmail.deliverShopEmail;
let shipAdminOrderWithSql: typeof ShopAdminOrders.shipAdminOrderWithSql;
let fulfillShopSessionWithSql: typeof ShopCheckoutOrder.fulfillShopSessionWithSql;
let reserveShopCartWithSql: typeof ShopCheckoutOrder.reserveShopCartWithSql;

loadLocalEnv();

const databaseUrl = process.env.NEON_DATABASE_URL;
const stamp = Date.now();

describe('shop transactional emails', { skip: databaseUrl ? false : 'NEON_DATABASE_URL is not set' }, () => {
  before(async () => {
    const email = await import('./shop-email');
    const orders = await import('./shop-admin-orders');
    const checkout = await import('./shop-checkout-order');
    deliverShopEmail = email.deliverShopEmail;
    shipAdminOrderWithSql = orders.shipAdminOrderWithSql;
    fulfillShopSessionWithSql = checkout.fulfillShopSessionWithSql;
    reserveShopCartWithSql = checkout.reserveShopCartWithSql;
  });

  it('sends paid confirmation and dispatch once, retries failures, and skips existing orders', async () => {
    const pool = new Pool({
      connectionString: databaseUrl?.replace(
        /([?&]sslmode=)(prefer|require|verify-ca)\b/gi,
        '$1verify-full',
      ),
      max: 1,
      connectionTimeoutMillis: 8000,
    });
    const client = await pool.connect();
    const sql: Sql = (text, values = []) => client.query(text, [...values]);
    const slug = `zz-email-${stamp}`;
    try {
      await client.query('begin');
      const productId = await insertSellableProduct(sql, {
        slug,
        sku: `ZZ-EMAIL-${stamp}`,
        priceCents: 2500,
        onHand: 2,
      });
      await client.query('set constraints all immediate');
      await client.query('set constraints all deferred');
      const reserved = await reserveShopCartWithSql(sql, [{ productId, variantId: null, quantity: 1 }]);
      const skippedUnpaid = await deliverShopEmail({
        type: 'order_confirmation',
        orderId: reserved.orderId,
        createIfMissing: true,
        sql,
        send: async () => ({ ok: true, id: 'should-not-send-unpaid' }),
      });
      assert.equal(skippedUnpaid.status, 'skipped');
      assert.equal(await deliveryCount(sql, reserved.orderId, 'order_confirmation'), 0);

      await client.query('set constraints all deferred');
      const newlyPaid = await fulfillShopSessionWithSql(
        sql,
        paidSession(reserved.orderId, reserved.totalCents, reserved.shippingCents),
      );
      await client.query('set constraints all immediate');
      assert.equal(newlyPaid, true);

      const skippedExisting = await deliverShopEmail({
        type: 'order_confirmation',
        orderId: reserved.orderId,
        createIfMissing: false,
        sql,
        send: async () => ({ ok: true, id: 'should-not-send-existing' }),
      });
      assert.equal(skippedExisting.status, 'skipped');
      assert.equal(await deliveryCount(sql, reserved.orderId, 'order_confirmation'), 0);

      let sendCount = 0;
      const first = await deliverShopEmail({
        type: 'order_confirmation',
        orderId: reserved.orderId,
        createIfMissing: true,
        sql,
        send: async (email) => {
          sendCount += 1;
          assert.match(email.subject, /confirmed/);
          assert.match(email.text, /Market Tote|Checkout tote|tote/i);
          assert.match(email.text, /\$5\.00/);
          assert.match(email.to, /alex@example.com/);
          return { ok: true, id: 'msg_confirm_1' };
        },
      });
      assert.equal(first.status, 'sent');
      assert.equal(sendCount, 1);

      const duplicate = await deliverShopEmail({
        type: 'order_confirmation',
        orderId: reserved.orderId,
        createIfMissing: true,
        sql,
        send: async () => {
          sendCount += 1;
          return { ok: true, id: 'msg_confirm_2' };
        },
      });
      assert.equal(duplicate.status, 'skipped');
      assert.equal(sendCount, 1);
      assert.equal(await deliveryCount(sql, reserved.orderId, 'order_confirmation'), 1);
      assert.equal(await deliveryStatus(sql, reserved.orderId, 'order_confirmation'), 'sent');

      const existingOrderSkip = await deliverShopEmail({
        type: 'dispatch',
        orderId: reserved.orderId,
        createIfMissing: false,
        sql,
        send: async () => ({ ok: true, id: 'should-not-dispatch' }),
      });
      assert.equal(existingOrderSkip.status, 'skipped');

      await client.query('set constraints all deferred');
      const shipped = await shipAdminOrderWithSql(sql, reserved.orderId, {
        carrier: 'Australia Post',
        trackingNumber: 'https://auspost.com.au/mypost/track/#/details/ABC123',
      });
      await client.query('set constraints all immediate');

      let dispatchAttempts = 0;
      const failedDispatch = await deliverShopEmail({
        type: 'dispatch',
        orderId: reserved.orderId,
        shipmentId: shipped.shipmentId,
        createIfMissing: true,
        sql,
        send: async () => {
          dispatchAttempts += 1;
          return { ok: false, error: 'Resend mailbox unavailable' };
        },
      });
      assert.equal(failedDispatch.status, 'failed');
      assert.equal(dispatchAttempts, 2);
      assert.equal(await deliveryStatus(sql, reserved.orderId, 'dispatch'), 'failed');

      const retriedDispatch = await deliverShopEmail({
        type: 'dispatch',
        orderId: reserved.orderId,
        shipmentId: shipped.shipmentId,
        createIfMissing: false,
        sql,
        send: async (email) => {
          dispatchAttempts += 1;
          assert.match(email.subject, /shipped/);
          assert.match(email.text, /Australia Post/);
          assert.match(email.text, /Track this parcel/);
          return { ok: true, id: 'msg_dispatch_1' };
        },
      });
      assert.equal(retriedDispatch.status, 'sent');
      assert.equal(dispatchAttempts, 3);
      assert.equal(await deliveryCount(sql, reserved.orderId, 'dispatch'), 1);
      assert.equal(await deliveryStatus(sql, reserved.orderId, 'dispatch'), 'sent');
    } finally {
      await client.query('rollback');
      const leftover = await client.query<{ count: string }>(
        `select count(*)::text as count from products where slug = $1`,
        [slug],
      );
      assert.equal(leftover.rows[0]?.count, '0');
      client.release();
      await pool.end();
    }
  });
});

async function insertSellableProduct(
  sql: Sql,
  input: { slug: string; sku: string; priceCents: number; onHand: number },
): Promise<string> {
  const product = await sql<{ id: string }>(
    `
      insert into products (name, slug, description, status, price_cents, sku, requires_shipping)
      values ('Email tote', $1, '', 'active', $2, $3, true)
      returning id
    `,
    [input.slug, input.priceCents, input.sku],
  );
  const productId = product.rows[0]?.id;
  assert.ok(productId);
  await sql('select id from products where id = $1 for update', [productId]);
  const inventory = await sql<{ id: string }>(
    `insert into inventory (product_id, variant_id, on_hand, reserved) values ($1, null, 0, 0) returning id`,
    [productId],
  );
  const inventoryId = inventory.rows[0]?.id;
  assert.ok(inventoryId);
  await sql('update inventory set on_hand = $2 where id = $1', [inventoryId, input.onHand]);
  await sql(
    `
      insert into inventory_movements (
        inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
      ) values ($1, 'restock', $2, 0, $2, 0, 'Opening stock')
    `,
    [inventoryId, input.onHand],
  );
  return productId;
}

function paidSession(orderId: string, amountTotal: number, shippingAmount: number): ShopSessionSnapshot {
  return {
    id: `cs_test_${orderId.replace(/-/g, '').slice(0, 24)}`,
    livemode: false,
    mode: 'payment',
    currency: 'aud',
    status: 'complete',
    paymentStatus: 'paid',
    amountTotal,
    paymentIntentId: `pi_test_${orderId.replace(/-/g, '').slice(0, 16)}`,
    orderId,
    purpose: SHOP_ORDER_PURPOSE,
    shippingAmount,
    customer: {
      name: 'Alex Reader',
      email: 'alex@example.com',
      phone: null,
      shipName: 'Alex Reader',
      shipLine1: '12 Hunter Street',
      shipLine2: '',
      shipCity: 'Newcastle',
      shipState: 'NSW',
      shipPostcode: '2300',
      shipCountry: 'AU',
    },
  };
}

async function deliveryCount(sql: Sql, orderId: string, type: string): Promise<number> {
  const result = await sql<{ count: string }>(
    `select count(*)::text as count from email_deliveries where order_id = $1 and email_type = $2`,
    [orderId, type],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function deliveryStatus(sql: Sql, orderId: string, type: string): Promise<string> {
  const result = await sql<{ status: string }>(
    `select status from email_deliveries where order_id = $1 and email_type = $2`,
    [orderId, type],
  );
  return result.rows[0]?.status ?? '';
}

function loadLocalEnv() {
  if (process.env.NEON_DATABASE_URL) {
    return;
  }
  let text = '';
  try {
    text = readFileSync('.env.local', 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const separator = line.indexOf('=');
    if (separator <= 0 || line.startsWith('#')) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
