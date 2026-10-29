import 'server-only';

import { transaction, type Sql } from '@/lib/db';
import {
  AdminInputError,
  decideStockChange,
  formatCentsForInput,
  parseProductDraft,
  type ParsedImage,
  type ParsedProduct,
  type ParsedVariant,
  type ProductKind,
  type ProductStatus,
} from '@/lib/shop-admin-policy';
import { logShopDatabaseError } from '@/lib/shop-log';
import type {
  AdminImageView,
  AdminMovement,
  AdminProductListItem,
  AdminProductView,
  AdminStock,
  AdminVariantView,
} from '@/lib/shop-admin-types';

export type { AdminProductListItem, AdminProductView } from '@/lib/shop-admin-types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type InventoryRow = {
  id: string;
  variant_id: string | null;
  on_hand: number;
  reserved: number;
};

export async function listAdminProducts(status: ProductStatus | null): Promise<AdminProductListItem[]> {
  return transaction(async (sql) => {
    const result = await sql<Record<string, unknown>>(
      `
        select
          p.id,
          p.name,
          p.slug,
          p.status,
          case
            when exists (select 1 from product_variants v where v.product_id = p.id)
              then 'variants'
            else 'simple'
          end as kind,
          coalesce((
            select sum(i.on_hand)::int from inventory i where i.product_id = p.id
          ), 0) as on_hand,
          coalesce((
            select sum(i.reserved)::int from inventory i where i.product_id = p.id
          ), 0) as reserved
        from products p
        where ($1::text is null or p.status = $1)
        order by p.updated_at desc, p.name asc
      `,
      [status],
    );
    return result.rows.map(mapListItem);
  });
}

export async function getAdminProduct(id: string): Promise<AdminProductView | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }
  return transaction(async (sql) => readProduct(sql, id.toLowerCase()));
}

export async function saveAdminProduct(input: unknown): Promise<string> {
  const draft = parseProductDraft(input);
  return transaction(async (sql) => {
    const productId = draft.id ? await updateExisting(sql, draft) : await insertProduct(sql, draft);
    await replaceImages(sql, productId, draft.images);
    return productId;
  });
}

export async function deleteAdminProduct(id: string): Promise<void> {
  if (!UUID_PATTERN.test(id)) {
    throw new AdminInputError('That product could not be found.');
  }
  await transaction(async (sql) => {
    const productId = id.toLowerCase();
    await lockProduct(sql, productId);
    const removable = await sql<{ removable: boolean }>(
      `
        select (
          not exists (select 1 from order_items where product_id = $1)
          and not exists (
            select 1
            from inventory i
            where i.product_id = $1
              and (
                i.on_hand <> 0
                or i.reserved <> 0
                or exists (select 1 from inventory_movements m where m.inventory_id = i.id)
                or exists (select 1 from inventory_reservations r where r.inventory_id = i.id)
              )
          )
        ) as removable
      `,
      [productId],
    );
    if (removable.rows[0]?.removable !== true) {
      throw new AdminInputError(
        'This product has stock history or orders, so it can be archived but not deleted.',
      );
    }
    await sql(`delete from inventory where product_id = $1`, [productId]);
    await sql(`delete from product_variants where product_id = $1`, [productId]);
    await sql(`delete from products where id = $1`, [productId]);
  });
}

export function logAdminDatabaseError(scope: string, error: unknown): void {
  logShopDatabaseError(scope, error);
}

export function databaseSafeMessage(error: unknown): string {
  const record = error && typeof error === 'object' ? (error as { code?: string; constraint?: string; message?: string }) : {};
  if (record.constraint === 'products_slug_key') {
    return 'That link is already used.';
  }
  if (record.constraint === 'products_sku_key' || record.constraint === 'product_variants_sku_key') {
    return 'That SKU is already used.';
  }
  const message = typeof record.message === 'string' ? record.message : '';
  if (message.includes('is already in use')) {
    return 'That SKU is already used.';
  }
  if (message.includes('needs a price and sku')) {
    return 'Add a price and SKU before publishing.';
  }
  if (message.includes('needs an inventory row') || message.includes('without inventory')) {
    return 'Add stock before publishing.';
  }
  if (message.includes('needs an active variant')) {
    return 'Add an active option before publishing.';
  }
  if (message.includes('keeps its price and sku') || message.includes('clear the product price')) {
    return 'A product with options keeps its price and SKU on each option.';
  }
  if (message.includes('already stocked without variants') || message.includes('stock belongs on the variants')) {
    return 'This product already has stock without options.';
  }
  if (message.includes('cannot delete inventory') || message.includes('stock history')) {
    return 'Stock that has been recorded cannot be deleted.';
  }
  return 'The shop could not save that change.';
}

async function insertProduct(sql: Sql, draft: ParsedProduct): Promise<string> {
  const inserted = await sql<{ id: string }>(
    `
      insert into products (name, slug, description, status, price_cents, sku, requires_shipping)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id
    `,
    [draft.name, draft.slug, draft.description, draft.status, draft.priceCents, draft.sku, draft.requiresShipping],
  );
  const productId = inserted.rows[0]?.id;
  if (!productId) {
    throw new AdminInputError('The product could not be saved.');
  }
  await lockProduct(sql, productId);
  if (draft.kind === 'variants') {
    await writeVariants(sql, productId, draft, true);
  } else {
    await applyDesiredStock(sql, productId, null, draft.onHand, draft.status === 'active');
  }
  return productId;
}

async function updateExisting(sql: Sql, draft: ParsedProduct): Promise<string> {
  const productId = draft.id;
  if (!productId) {
    throw new AdminInputError('That product could not be found.');
  }
  await lockProduct(sql, productId);
  const current = await readShape(sql, productId);
  if (!current) {
    throw new AdminInputError('That product could not be found.');
  }
  if (draft.kind === 'simple' && current.hasVariants) {
    throw new AdminInputError('This product cannot change between a simple product and options.');
  }
  if (draft.kind === 'variants' && current.hasInventory && !current.hasVariants) {
    throw new AdminInputError('This product already has stock without options.');
  }

  if (draft.kind === 'variants') {
    await sql(
      `
        update products
        set name = $2,
            slug = $3,
            description = $4,
            status = $5,
            price_cents = null,
            sku = null,
            requires_shipping = $6
        where id = $1
      `,
      [productId, draft.name, draft.slug, draft.description, draft.status, draft.requiresShipping],
    );
    await writeVariants(sql, productId, draft, false);
    return productId;
  }

  await sql(
    `
      update products
      set name = $2,
          slug = $3,
          description = $4,
          status = $5,
          price_cents = $6,
          sku = $7,
          requires_shipping = $8
      where id = $1
    `,
    [
      productId,
      draft.name,
      draft.slug,
      draft.description,
      draft.status,
      draft.priceCents,
      draft.sku,
      draft.requiresShipping,
    ],
  );
  await applyDesiredStock(sql, productId, null, draft.onHand, draft.status === 'active');
  return productId;
}

async function writeVariants(
  sql: Sql,
  productId: string,
  draft: ParsedProduct,
  isNew: boolean,
): Promise<void> {
  const knownVariants = isNew ? new Set<string>() : (await lockInventory(sql, productId)).variantIds;
  for (const variant of draft.variants) {
    if (variant.remove) {
      if (!variant.id || !knownVariants.has(variant.id)) {
        throw new AdminInputError('One of the options could not be found.');
      }
      await removeVariant(sql, productId, variant.id);
      continue;
    }
    const variantId =
      variant.id && knownVariants.has(variant.id)
        ? await updateVariant(sql, productId, variant)
        : await insertVariant(sql, productId, variant);
    await applyDesiredStock(
      sql,
      productId,
      variantId,
      variant.onHand,
      draft.status === 'active' && variant.active,
    );
  }
}

async function insertVariant(sql: Sql, productId: string, variant: ParsedVariant): Promise<string> {
  const inserted = await sql<{ id: string }>(
    `
      insert into product_variants (product_id, name, sku, price_cents, active)
      values ($1, $2, $3, $4, $5)
      returning id
    `,
    [productId, variant.name, variant.sku, variant.priceCents, variant.active],
  );
  const id = inserted.rows[0]?.id;
  if (!id) {
    throw new AdminInputError('An option could not be saved.');
  }
  return id;
}

async function updateVariant(sql: Sql, productId: string, variant: ParsedVariant): Promise<string> {
  if (!variant.id) {
    throw new AdminInputError('One of the options could not be found.');
  }
  const updated = await sql<{ id: string }>(
    `
      update product_variants
      set name = $3, sku = $4, price_cents = $5, active = $6
      where id = $2 and product_id = $1
      returning id
    `,
    [productId, variant.id, variant.name, variant.sku, variant.priceCents, variant.active],
  );
  if (!updated.rows[0]?.id) {
    throw new AdminInputError('One of the options could not be found.');
  }
  return variant.id;
}

async function removeVariant(sql: Sql, productId: string, variantId: string): Promise<void> {
  const allowed = await sql<{ removable: boolean }>(
    `
      select (
        not exists (select 1 from order_items where variant_id = $2 and product_id = $1)
        and not exists (
          select 1
          from inventory i
          where i.product_id = $1
            and i.variant_id = $2
            and (
              i.on_hand <> 0
              or i.reserved <> 0
              or exists (select 1 from inventory_movements m where m.inventory_id = i.id)
              or exists (select 1 from inventory_reservations r where r.inventory_id = i.id)
            )
        )
      ) as removable
    `,
    [productId, variantId],
  );
  if (allowed.rows[0]?.removable !== true) {
    throw new AdminInputError('An option with stock history or orders can be retired, not removed.');
  }
  await sql(`delete from product_images where product_id = $1 and variant_id = $2`, [productId, variantId]);
  await sql(`delete from inventory where product_id = $1 and variant_id = $2`, [productId, variantId]);
  await sql(`delete from product_variants where product_id = $1 and id = $2`, [productId, variantId]);
}

async function applyDesiredStock(
  sql: Sql,
  productId: string,
  variantId: string | null,
  desired: number | null,
  required: boolean,
): Promise<void> {
  const current = await sql<InventoryRow>(
    `
      select id, variant_id, on_hand, reserved
      from inventory
      where product_id = $1
        and variant_id is not distinct from $2
      for update
    `,
    [productId, variantId],
  );
  const row = current.rows[0];
  const decision = decideStockChange({
    hasInventory: Boolean(row),
    onHand: row ? readCount(row.on_hand) : 0,
    reserved: row ? readCount(row.reserved) : 0,
    desired: desired === null && required && !row ? 0 : desired,
  });
  if (decision.action === 'invalid') {
    throw new AdminInputError(decision.message);
  }
  if (decision.action === 'unchanged') {
    if (required && !row) {
      throw new AdminInputError('Enter on-hand stock before publishing.');
    }
    return;
  }
  if (decision.action === 'open') {
    await openStock(sql, productId, variantId, decision.quantity);
    return;
  }
  if (!row) {
    throw new AdminInputError('Enter on-hand stock before publishing.');
  }
  await sql(`update inventory set on_hand = $2 where id = $1`, [row.id, decision.nextOnHand]);
  await sql(
    `
      insert into inventory_movements (
        inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
      ) values ($1, 'adjustment', $2, 0, $3, $4, 'Stock adjustment')
    `,
    [row.id, decision.delta, decision.nextOnHand, readCount(row.reserved)],
  );
}

async function openStock(
  sql: Sql,
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<void> {
  const inserted = await sql<{ id: string }>(
    `
      insert into inventory (product_id, variant_id, on_hand, reserved)
      values ($1, $2, 0, 0)
      returning id
    `,
    [productId, variantId],
  );
  const inventoryId = inserted.rows[0]?.id;
  if (!inventoryId) {
    throw new AdminInputError('Stock could not be recorded.');
  }
  if (quantity === 0) {
    return;
  }
  await sql(`update inventory set on_hand = $2 where id = $1`, [inventoryId, quantity]);
  await sql(
    `
      insert into inventory_movements (
        inventory_id, movement_type, on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
      ) values ($1, 'restock', $2, 0, $2, 0, 'Opening stock')
    `,
    [inventoryId, quantity],
  );
}

async function replaceImages(sql: Sql, productId: string, images: ParsedImage[]): Promise<void> {
  const variants = await sql<{ id: string }>(
    `select id from product_variants where product_id = $1`,
    [productId],
  );
  const allowedVariants = new Set(variants.rows.map((row) => row.id));
  for (const image of images) {
    if (image.variantId && !allowedVariants.has(image.variantId)) {
      throw new AdminInputError('An image is attached to an option that is not on this product.');
    }
  }
  const kept = images.flatMap((image) => (image.id ? [image.id] : []));
  await sql(
    `
      delete from product_images
      where product_id = $1
        and not (id = any($2::uuid[]))
    `,
    [productId, kept],
  );
  for (const [index, image] of images.entries()) {
    if (image.id) {
      const updated = await sql(
        `
          update product_images
          set url = $3, alt = $4, sort_order = $5, variant_id = $6
          where id = $2 and product_id = $1
        `,
        [productId, image.id, image.url, image.alt, index, image.variantId],
      );
      if (updated.rowCount !== 1) {
        throw new AdminInputError('One of the images could not be found.');
      }
      continue;
    }
    await sql(
      `
        insert into product_images (product_id, variant_id, url, alt, sort_order)
        values ($1, $2, $3, $4, $5)
      `,
      [productId, image.variantId, image.url, image.alt, index],
    );
  }
}

async function readProduct(sql: Sql, id: string): Promise<AdminProductView | null> {
  const product = await sql<Record<string, unknown>>(
    `
      select id, name, slug, description, status, price_cents, sku, requires_shipping
      from products
      where id = $1
    `,
    [id],
  );
  const row = product.rows[0];
  if (!row) {
    return null;
  }
  const variants = await sql<Record<string, unknown>>(
    `
      select
        v.id,
        v.name,
        v.sku,
        v.price_cents,
        v.active,
        i.id as inventory_id,
        coalesce(i.on_hand, 0) as on_hand,
        coalesce(i.reserved, 0) as reserved,
        (
          not exists (select 1 from order_items oi where oi.variant_id = v.id)
          and not exists (
            select 1
            from inventory stock
            where stock.variant_id = v.id
              and (
                stock.on_hand <> 0
                or stock.reserved <> 0
                or exists (select 1 from inventory_movements m where m.inventory_id = stock.id)
                or exists (select 1 from inventory_reservations r where r.inventory_id = stock.id)
              )
          )
        ) as removable
      from product_variants v
      left join inventory i on i.variant_id = v.id
      where v.product_id = $1
      order by v.created_at asc, v.name asc
    `,
    [id],
  );
  const simple = await sql<Record<string, unknown>>(
    `
      select id, on_hand, reserved
      from inventory
      where product_id = $1 and variant_id is null
    `,
    [id],
  );
  const images = await sql<Record<string, unknown>>(
    `
      select id, url, alt, variant_id
      from product_images
      where product_id = $1
      order by sort_order asc, created_at asc
    `,
    [id],
  );
  const movements = await sql<Record<string, unknown>>(
    `
      select
        m.id,
        m.movement_type,
        m.on_hand_delta,
        m.on_hand_after,
        m.reserved_after,
        coalesce(m.note, '') as note,
        m.created_at,
        v.name as variant_name
      from inventory_movements m
      join inventory i on i.id = m.inventory_id
      left join product_variants v on v.id = i.variant_id
      where i.product_id = $1
      order by m.seq desc
      limit 12
    `,
    [id],
  );
  const history = await sql<{ has_history: boolean }>(
    `
      select (
        exists (select 1 from order_items where product_id = $1)
        or exists (
          select 1
          from inventory i
          where i.product_id = $1
            and (
              i.on_hand <> 0
              or i.reserved <> 0
              or exists (select 1 from inventory_movements m where m.inventory_id = i.id)
              or exists (select 1 from inventory_reservations r where r.inventory_id = i.id)
            )
        )
      ) as has_history
    `,
    [id],
  );

  const variantViews = variants.rows.map(mapVariant);
  const kind: ProductKind = variantViews.length > 0 ? 'variants' : 'simple';
  const simpleRow = simple.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: typeof row.description === 'string' ? row.description : '',
    requiresShipping: row.requires_shipping === true,
    status: parseStatus(row.status),
    kind,
    kindLocked: kind === 'variants' || Boolean(simpleRow),
    price: formatCentsForInput(readNullableCount(row.price_cents)),
    sku: typeof row.sku === 'string' ? row.sku : '',
    canDelete: history.rows[0]?.has_history !== true,
    stock: simpleRow ? mapStock(simpleRow) : null,
    variants: variantViews,
    images: images.rows.map(mapImage),
    movements: movements.rows.map(mapMovement),
  };
}

async function readShape(
  sql: Sql,
  productId: string,
): Promise<{ hasVariants: boolean; hasInventory: boolean } | null> {
  const found = await sql<{ id: string }>(`select id from products where id = $1`, [productId]);
  if (!found.rows[0]) {
    return null;
  }
  const variants = await sql<{ id: string }>(
    `select id from product_variants where product_id = $1 limit 1`,
    [productId],
  );
  const inventory = await sql<{ id: string }>(
    `select id from inventory where product_id = $1 and variant_id is null limit 1`,
    [productId],
  );
  return {
    hasVariants: Boolean(variants.rows[0]),
    hasInventory: Boolean(inventory.rows[0]),
  };
}

async function lockProduct(sql: Sql, productId: string): Promise<void> {
  const locked = await sql(`select id from products where id = $1 for update`, [productId]);
  if (locked.rowCount !== 1) {
    throw new AdminInputError('That product could not be found.');
  }
}

async function lockInventory(
  sql: Sql,
  productId: string,
): Promise<{ variantIds: Set<string> }> {
  await sql(
    `
      select id
      from inventory
      where product_id = $1
      order by id
      for update
    `,
    [productId],
  );
  const variants = await sql<{ id: string }>(
    `select id from product_variants where product_id = $1`,
    [productId],
  );
  return {
    variantIds: new Set(variants.rows.map((row) => row.id)),
  };
}

function mapListItem(row: Record<string, unknown>): AdminProductListItem {
  const onHand = readCount(row.on_hand);
  const reserved = readCount(row.reserved);
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    status: parseStatus(row.status),
    kind: row.kind === 'variants' ? 'variants' : 'simple',
    onHand,
    reserved,
    available: onHand - reserved,
  };
}

function mapVariant(row: Record<string, unknown>): AdminVariantView {
  const hasInventory = row.inventory_id !== null && row.inventory_id !== undefined;
  return {
    id: String(row.id),
    name: String(row.name),
    sku: String(row.sku),
    price: formatCentsForInput(readNullableCount(row.price_cents)) ,
    active: row.active === true,
    removable: row.removable === true,
    stock: {
      inventoryId: hasInventory ? String(row.inventory_id) : null,
      onHand: readCount(row.on_hand),
      reserved: readCount(row.reserved),
      available: readCount(row.on_hand) - readCount(row.reserved),
    },
  };
}

function mapStock(row: Record<string, unknown>): AdminStock {
  const onHand = readCount(row.on_hand);
  const reserved = readCount(row.reserved);
  return {
    inventoryId: String(row.id),
    onHand,
    reserved,
    available: onHand - reserved,
  };
}

function mapImage(row: Record<string, unknown>): AdminImageView {
  return {
    id: String(row.id),
    url: String(row.url),
    alt: typeof row.alt === 'string' ? row.alt : '',
    variantId: typeof row.variant_id === 'string' ? row.variant_id : null,
  };
}

function mapMovement(row: Record<string, unknown>): AdminMovement {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  return {
    id: String(row.id),
    variantName: typeof row.variant_name === 'string' ? row.variant_name : null,
    type: String(row.movement_type),
    onHandDelta: readCount(row.on_hand_delta),
    onHandAfter: readCount(row.on_hand_after),
    reservedAfter: readCount(row.reserved_after),
    note: typeof row.note === 'string' ? row.note : '',
    createdAt,
  };
}

function parseStatus(value: unknown): ProductStatus {
  if (value === 'draft' || value === 'active' || value === 'archived') {
    return value;
  }
  throw new AdminInputError('That product could not be read.');
}

function readCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new AdminInputError('That product could not be read.');
  }
  return parsed;
}

function readNullableCount(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return readCount(value);
}

