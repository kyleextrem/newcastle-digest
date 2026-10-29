import Module from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { Pool } from 'pg';
import type { Sql } from './db';
import { SHOP_ORDER_PURPOSE, type ShopSessionSnapshot } from './shop-checkout';
import type * as ShopCheckoutOrder from './shop-checkout-order';

const loaded = (Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown })._load.bind(
  Module,
);
(Module as unknown as { _load: typeof loaded })._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {};
  }
  return loaded(request, parent, isMain);
};

let cancelShopCheckoutWithSql: typeof ShopCheckoutOrder.cancelShopCheckoutWithSql;
let fulfillShopSessionWithSql: typeof ShopCheckoutOrder.fulfillShopSessionWithSql;
let reserveShopCartWithSql: typeof ShopCheckoutOrder.reserveShopCartWithSql;

loadLocalEnv();

const databaseUrl = process.env.NEON_DATABASE_URL;
const stamp = Date.now();

describe('shop checkout inventory', { skip: databaseUrl ? false : 'NEON_DATABASE_URL is not set' }, () => {
  before(async () => {
    const order = await import('./shop-checkout-order');
    cancelShopCheckoutWithSql = order.cancelShopCheckoutWithSql;
    fulfillShopSessionWithSql = order.fulfillShopSessionWithSql;
    reserveShopCartWithSql = order.reserveShopCartWithSql;
  });

  it('reserves, charges once, rejects oversell, and rolls back', async () => {
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
    const slug = `zz-checkout-${stamp}`;
    const sku = `ZZ-CHECKOUT-${stamp}`;
    try {
      await client.query('begin');
      const productId = await insertSellableProduct(sql, {
        slug,
        sku,
        priceCents: 1800,
        requiresShipping: true,
        onHand: 2,
      });
      await client.query('set constraints all immediate');
      await client.query('set constraints all deferred');

      const reserved = await reserveShopCartWithSql(sql, [
        { productId, variantId: null, quantity: 2 },
      ]);
      await client.query('set constraints all immediate');
      assert.equal(reserved.shippingCents, 500);
      assert.equal(reserved.totalCents, 4100);
      assert.equal(await stock(sql, productId), '2:2');

      await client.query('set constraints all deferred');
      await fulfillShopSessionWithSql(sql, paidSession(reserved.orderId, reserved.totalCents, reserved.shippingCents));
      await client.query('set constraints all immediate');
      assert.equal(await stock(sql, productId), '0:0');
      assert.equal(await orderStatus(sql, reserved.orderId), 'paid');

      await client.query('set constraints all deferred');
      await fulfillShopSessionWithSql(sql, paidSession(reserved.orderId, reserved.totalCents, reserved.shippingCents));
      await client.query('set constraints all immediate');
      assert.equal(await stock(sql, productId), '0:0');

      await assert.rejects(
        reserveShopCartWithSql(sql, [{ productId, variantId: null, quantity: 1 }]),
        /enough stock|no longer available/,
      );
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

  it('releases a cancelled checkout and ships digital orders with no postage', async () => {
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
    const slug = `zz-checkout-digital-${stamp}`;
    const sku = `ZZ-DIGITAL-${stamp}`;
    try {
      await client.query('begin');
      const productId = await insertSellableProduct(sql, {
        slug,
        sku,
        priceCents: 900,
        requiresShipping: false,
        onHand: 3,
      });
      await client.query('set constraints all immediate');
      await client.query('set constraints all deferred');

      const held = await reserveShopCartWithSql(sql, [{ productId, variantId: null, quantity: 1 }]);
      assert.equal(held.shippingCents, 0);
      assert.equal(held.totalCents, 900);
      await client.query('set constraints all deferred');
      await cancelShopCheckoutWithSql(sql, held.orderId, 'released');
      await client.query('set constraints all immediate');
      assert.equal(await stock(sql, productId), '3:0');
      assert.equal(await orderStatus(sql, held.orderId), 'cancelled');

      await client.query('set constraints all deferred');
      const paid = await reserveShopCartWithSql(sql, [{ productId, variantId: null, quantity: 1 }]);
      await client.query('set constraints all immediate');
      await client.query('set constraints all deferred');
      await fulfillShopSessionWithSql(sql, paidSession(paid.orderId, 900, 0));
      await client.query('set constraints all immediate');
      assert.equal(await stock(sql, productId), '2:0');
      assert.equal(await orderStatus(sql, paid.orderId), 'paid');
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
  input: { slug: string; sku: string; priceCents: number; requiresShipping: boolean; onHand: number },
): Promise<string> {
  const product = await sql<{ id: string }>(
    `
      insert into products (name, slug, description, status, price_cents, sku, requires_shipping)
      values ('Checkout tote', $1, '', 'active', $2, $3, $4)
      returning id
    `,
    [input.slug, input.priceCents, input.sku, input.requiresShipping],
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
  if (input.onHand > 0) {
    await sql('update inventory set on_hand = $2 where id = $1', [inventoryId, input.onHand]);
    await sql(
      `
        insert into inventory_movements (
          inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
        ) values ($1, 'restock', $2, 0, $2, 0, 'Opening stock')
      `,
      [inventoryId, input.onHand],
    );
  }
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

async function stock(sql: Sql, productId: string): Promise<string> {
  const result = await sql<{ on_hand: number; reserved: number }>(
    `select on_hand, reserved from inventory where product_id = $1 and variant_id is null`,
    [productId],
  );
  return `${result.rows[0]?.on_hand}:${result.rows[0]?.reserved}`;
}

async function orderStatus(sql: Sql, orderId: string): Promise<string> {
  const result = await sql<{ status: string }>(`select status from orders where id = $1`, [orderId]);
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

