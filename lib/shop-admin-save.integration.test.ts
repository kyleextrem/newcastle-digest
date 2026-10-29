import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { Pool, type PoolClient } from 'pg';
import { parseProductDraft } from './shop-admin-policy';

loadLocalEnv();

const databaseUrl = process.env.NEON_DATABASE_URL;
const stamp = Date.now();
const slug = `zz-save-rollback-${stamp}`;
const sku = `ZZ-SAVE-${stamp}`;
const sanityProject = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo';
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const imageUrls = [0, 1, 2, 3].map(
  (index) =>
    `https://cdn.sanity.io/images/${sanityProject}/${sanityDataset}/shop-save-${stamp}-${index}-800x800.jpg`,
);

describe('shop admin product save', { skip: databaseUrl ? false : 'NEON_DATABASE_URL is not set' }, () => {
  it('creates a product with four Sanity image URLs, edits it, and rolls back', async () => {
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
      const draft = parseProductDraft({
        id: null,
        name: 'Rollback tote',
        slug,
        description: 'Four uploaded photos',
        requiresShipping: true,
        status: 'draft',
        kind: 'simple',
        price: '18.00',
        sku,
        onHand: 4,
        variants: [],
        images: imageUrls.map((url, index) => ({
          id: null,
          url,
          alt: `Photo ${index + 1}`,
          variantId: null,
        })),
      });
      assert.equal(draft.images.length, 4);
      for (const image of draft.images) {
        assert.match(image.url, /^https:\/\/cdn\.sanity\.io\//);
        assert.equal(image.id, null);
      }

      await client.query('begin');
      const productId = await insertDraft(client, draft);
      await replaceImages(client, productId, draft.images);
      await client.query('set constraints all immediate');

      const created = await client.query<{ name: string; image_count: string }>(
        `
          select p.name, count(i.id)::text as image_count
          from products p
          left join product_images i on i.product_id = p.id
          where p.id = $1
          group by p.name
        `,
        [productId],
      );
      assert.equal(created.rows[0]?.name, 'Rollback tote');
      assert.equal(created.rows[0]?.image_count, '4');

      const editedName = 'Rollback tote edited';
      const editedSlug = `${slug}-edited`;
      await client.query(
        `
          update products
          set name = $2, slug = $3, description = $4, status = $5, price_cents = $6, sku = $7, requires_shipping = $8
          where id = $1
        `,
        [productId, editedName, editedSlug, 'Updated copy', 'draft', 2200, `${sku}-E`, true],
      );
      const existing = await client.query<{ id: string; url: string }>(
        `select id, url from product_images where product_id = $1 order by sort_order`,
        [productId],
      );
      assert.equal(existing.rows.length, 4);
      await replaceImages(
        client,
        productId,
        existing.rows.map((row, index) => ({
          id: row.id,
          url: row.url,
          alt: index === 0 ? 'Cover photo' : `Photo ${index + 1}`,
          variantId: null,
        })),
      );
      await client.query('set constraints all immediate');

      const edited = await client.query<{ name: string; slug: string; alt: string; image_count: string }>(
        `
          select p.name, p.slug, min(i.alt) filter (where i.sort_order = 0) as alt, count(i.id)::text as image_count
          from products p
          join product_images i on i.product_id = p.id
          where p.id = $1
          group by p.name, p.slug
        `,
        [productId],
      );
      assert.equal(edited.rows[0]?.name, editedName);
      assert.equal(edited.rows[0]?.slug, editedSlug);
      assert.equal(edited.rows[0]?.alt, 'Cover photo');
      assert.equal(edited.rows[0]?.image_count, '4');
    } finally {
      await client.query('rollback');
      const remaining = await client.query<{ count: string }>(
        `select count(*)::text as count from products where slug in ($1, $2)`,
        [slug, `${slug}-edited`],
      );
      assert.equal(remaining.rows[0]?.count, '0');
      client.release();
      await pool.end();
    }
  });
});

async function insertDraft(
  client: PoolClient,
  draft: ReturnType<typeof parseProductDraft>,
): Promise<string> {
  const inserted = await client.query<{ id: string }>(
    `
      insert into products (name, slug, description, status, price_cents, sku, requires_shipping)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id
    `,
    [draft.name, draft.slug, draft.description, draft.status, draft.priceCents, draft.sku, draft.requiresShipping],
  );
  const productId = inserted.rows[0]?.id;
  assert.ok(productId);
  await client.query('select id from products where id = $1 for update', [productId]);
  const inventory = await client.query<{ id: string }>(
    `insert into inventory (product_id, variant_id, on_hand, reserved) values ($1, null, 0, 0) returning id`,
    [productId],
  );
  const inventoryId = inventory.rows[0]?.id;
  assert.ok(inventoryId);
  if (draft.onHand && draft.onHand > 0) {
    await client.query('update inventory set on_hand = $2 where id = $1', [inventoryId, draft.onHand]);
    await client.query(
      `
        insert into inventory_movements (
          inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
        ) values ($1, 'restock', $2, 0, $2, 0, 'Opening stock')
      `,
      [inventoryId, draft.onHand],
    );
  }
  return productId;
}

async function replaceImages(
  client: PoolClient,
  productId: string,
  images: { id: string | null; url: string; alt: string; variantId: string | null }[],
): Promise<void> {
  const kept = images.flatMap((image) => (image.id ? [image.id] : []));
  await client.query(
    `
      delete from product_images
      where product_id = $1
        and not (id = any($2::uuid[]))
    `,
    [productId, kept],
  );
  for (const [index, image] of images.entries()) {
    if (image.id) {
      const updated = await client.query(
        `
          update product_images
          set url = $3, alt = $4, sort_order = $5, variant_id = $6
          where id = $2 and product_id = $1
        `,
        [productId, image.id, image.url, image.alt, index, image.variantId],
      );
      assert.equal(updated.rowCount, 1);
      continue;
    }
    await client.query(
      `
        insert into product_images (product_id, variant_id, url, alt, sort_order)
        values ($1, $2, $3, $4, $5)
      `,
      [productId, image.variantId, image.url, image.alt, index],
    );
  }
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
