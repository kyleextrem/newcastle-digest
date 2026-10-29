import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { Pool } from 'pg';

loadLocalEnv();

const databaseUrl = process.env.NEON_DATABASE_URL;
const slug = `zz-admin-rollback-${Date.now()}`;

describe('shop admin stock ledger', { skip: databaseUrl ? false : 'NEON_DATABASE_URL is not set' }, () => {
  it('records opening stock and an adjustment, then rolls back', async () => {
    const pool = new Pool({
      connectionString: databaseUrl?.replace(
        /([?&]sslmode=)(prefer|require|verify-ca)\b/gi,
        '$1verify-full',
      ),
      max: 1,
      connectionTimeoutMillis: 8000,
    });
    const client = await pool.connect();
    try {
      await client.query('begin');
      const product = await client.query<{ id: string }>(
        `
          insert into products (name, slug, description, status, price_cents, sku, requires_shipping)
          values ('Rollback tote', $1, '', 'active', 1800, $2, true)
          returning id
        `,
        [slug, `ZZ-${Date.now()}`],
      );
      const productId = product.rows[0]?.id;
      assert.ok(productId);
      await client.query('select id from products where id = $1 for update', [productId]);
      const inventory = await client.query<{ id: string }>(
        `
          insert into inventory (product_id, variant_id, on_hand, reserved)
          values ($1, null, 0, 0)
          returning id
        `,
        [productId],
      );
      const inventoryId = inventory.rows[0]?.id;
      assert.ok(inventoryId);
      await client.query('update inventory set on_hand = 3 where id = $1', [inventoryId]);
      await client.query(
        `
          insert into inventory_movements (
            inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
          ) values ($1, 'restock', 3, 0, 3, 0, 'Opening stock')
        `,
        [inventoryId],
      );
      await client.query('update inventory set on_hand = 1 where id = $1', [inventoryId]);
      await client.query(
        `
          insert into inventory_movements (
            inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
          ) values ($1, 'adjustment', -2, 0, 1, 0, 'Stock adjustment')
        `,
        [inventoryId],
      );
      const stock = await client.query<{ on_hand: number; reserved: number }>(
        `select on_hand, reserved from inventory where id = $1`,
        [inventoryId],
      );
      assert.equal(stock.rows[0]?.on_hand, 1);
      assert.equal(stock.rows[0]?.reserved, 0);
      await assert.rejects(client.query('delete from inventory where id = $1', [inventoryId]));
    } finally {
      await client.query('rollback');
      const remaining = await client.query<{ count: string }>(
        `select count(*)::text as count from products where slug = $1`,
        [slug],
      );
      assert.equal(remaining.rows[0]?.count, '0');
      client.release();
      await pool.end();
    }
  });
});

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
