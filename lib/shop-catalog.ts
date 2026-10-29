import 'server-only';

import { cache } from 'react';
import { query } from '@/lib/db';
import {
  availabilityLabel,
  buildCartPreview,
  cataloguePriceLabel,
  parseCart,
  type CartCatalogRow,
  type CartPreview,
} from '@/lib/shop-display';
import type { ShopImage, ShopProduct, ShopProductCard, ShopVariant } from '@/lib/shop-types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type { ShopImage, ShopProduct, ShopProductCard, ShopVariant } from '@/lib/shop-types';

const LIST_PRODUCTS_SQL = `
  select
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price_cents,
    variant_summary.active_count,
    variant_summary.min_price_cents,
    variant_summary.max_price_cents,
    stock.available_quantity,
    image.url as image_url,
    image.alt as image_alt
  from products p
  left join lateral (
    select
      count(*)::int as active_count,
      min(v.price_cents)::int as min_price_cents,
      max(v.price_cents)::int as max_price_cents
    from product_variants v
    where v.product_id = p.id
      and v.active
  ) variant_summary on true
  left join lateral (
    select coalesce(sum(greatest(i.on_hand - i.reserved, 0)), 0)::int as available_quantity
    from inventory i
    left join product_variants v on v.id = i.variant_id
    where i.product_id = p.id
      and (
        (i.variant_id is null and variant_summary.active_count = 0)
        or v.active is true
      )
  ) stock on true
  left join lateral (
    select img.url, img.alt
    from product_images img
    left join product_variants v on v.id = img.variant_id
    where img.product_id = p.id
      and (img.variant_id is null or v.active is true)
    order by
      case when img.variant_id is null then 0 else 1 end,
      img.sort_order,
      img.created_at
    limit 1
  ) image on true
  where p.status = 'active'
  order by p.name asc
`;

const PRODUCT_SQL = `
  select
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price_cents,
    p.requires_shipping,
    coalesce((
      select greatest(i.on_hand - i.reserved, 0)
      from inventory i
      where i.product_id = p.id
        and i.variant_id is null
    ), 0)::int as available_quantity,
    coalesce((
      select json_agg(
        json_build_object(
          'id', variant_row.id,
          'name', variant_row.name,
          'price_cents', variant_row.price_cents,
          'available', variant_row.available
        )
        order by variant_row.name
      )
      from (
        select
          v.id,
          v.name,
          v.price_cents,
          greatest(coalesce(i.on_hand, 0) - coalesce(i.reserved, 0), 0)::int as available
        from product_variants v
        left join inventory i
          on i.variant_id = v.id
         and i.product_id = p.id
        where v.product_id = p.id
          and v.active
      ) variant_row
    ), '[]'::json) as variants,
    coalesce((
      select json_agg(
        json_build_object(
          'id', image_row.id,
          'variant_id', image_row.variant_id,
          'url', image_row.url,
          'alt', image_row.alt
        )
        order by image_row.sort_order, image_row.created_at
      )
      from (
        select
          img.id,
          img.variant_id,
          img.url,
          img.alt,
          img.sort_order,
          img.created_at
        from product_images img
        where img.product_id = p.id
          and (
            img.variant_id is null
            or exists (
              select 1
              from product_variants v
              where v.id = img.variant_id
                and v.product_id = p.id
                and v.active
            )
          )
      ) image_row
    ), '[]'::json) as images
  from products p
  where p.slug = $1
    and p.status = 'active'
`;

const CART_SQL = `
  select
    requested.product_id,
    requested.variant_id,
    p.id is not null as product_found,
    coalesce(p.status = 'active', false) as product_active,
    case when p.status = 'active' then p.name else null end as product_name,
    case when p.status = 'active' then p.slug else null end as slug,
    exists (
      select 1
      from product_variants existing
      where existing.product_id = p.id
    ) as has_variants,
    variant.id is not null as variant_found,
    coalesce(variant.active, false) as variant_active,
    case
      when p.status = 'active' and variant.active then variant.name
      else null
    end as variant_name,
    case
      when p.status is distinct from 'active' then null
      when requested.variant_id is null then p.price_cents
      when variant.active then variant.price_cents
      else null
    end as price_cents,
    case
      when p.status is distinct from 'active' then 0
      when requested.variant_id is null then coalesce(simple_stock.available, 0)
      when variant.active then coalesce(variant_stock.available, 0)
      else 0
    end as available,
    case
      when p.status is distinct from 'active' then null
      else coalesce(variant_image.url, product_image.url)
    end as image_url,
    case
      when p.status is distinct from 'active' then ''
      else coalesce(variant_image.alt, product_image.alt, '')
    end as image_alt
  from jsonb_to_recordset($1::jsonb) as requested(
    product_id uuid,
    variant_id uuid,
    quantity integer
  )
  left join products p on p.id = requested.product_id
  left join product_variants variant
    on variant.id = requested.variant_id
   and variant.product_id = requested.product_id
  left join lateral (
    select greatest(i.on_hand - i.reserved, 0)::int as available
    from inventory i
    where i.product_id = requested.product_id
      and i.variant_id is null
  ) simple_stock on requested.variant_id is null
  left join lateral (
    select greatest(i.on_hand - i.reserved, 0)::int as available
    from inventory i
    where i.variant_id = requested.variant_id
      and i.product_id = requested.product_id
  ) variant_stock on requested.variant_id is not null
  left join lateral (
    select img.url, img.alt
    from product_images img
    where img.product_id = requested.product_id
      and img.variant_id is null
    order by img.sort_order, img.created_at
    limit 1
  ) product_image on true
  left join lateral (
    select img.url, img.alt
    from product_images img
    where img.product_id = requested.product_id
      and img.variant_id = requested.variant_id
    order by img.sort_order, img.created_at
    limit 1
  ) variant_image on requested.variant_id is not null
`;

export const listActiveProducts = cache(async (): Promise<ShopProductCard[]> => {
  try {
    const result = await query(LIST_PRODUCTS_SQL);
    return result.rows.map(mapProductCard);
  } catch {
    console.error('Shop catalogue query failed');
    throw new Error('Shop catalogue query failed');
  }
});

export const getActiveProduct = cache(async (slug: string): Promise<ShopProduct | null> => {
  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }

  try {
    const result = await query(PRODUCT_SQL, [slug]);
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return mapProduct(row);
  } catch {
    console.error('Shop product query failed');
    throw new Error('Shop product query failed');
  }
});

export async function previewStoredCart(input: unknown): Promise<CartPreview> {
  const items = parseCart(
    input && typeof input === 'object' && !Array.isArray(input)
      ? input
      : { version: 1, items: input },
  );
  if (items.length === 0) {
    return {
      lines: [],
      totalLabel: null,
      checkoutAvailable: false,
      loadFailed: false,
    };
  }

  try {
    const result = await query(CART_SQL, [
      JSON.stringify(
        items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      ),
    ]);
    return buildCartPreview(items, result.rows.map(mapCartRow));
  } catch {
    console.error('Shop cart preview failed');
    return {
      lines: [],
      totalLabel: null,
      checkoutAvailable: false,
      loadFailed: true,
    };
  }
}

function mapProductCard(row: Record<string, unknown>): ShopProductCard {
  const id = readUuid(row.id);
  const name = readText(row.name);
  const slug = readText(row.slug);
  const available = readCount(row.available_quantity);
  const variantCount = readCount(row.active_count);
  if (!id || !name || !slug || available === null || variantCount === null) {
    throw new Error('Shop catalogue query failed');
  }

  const imageUrl = readHttpsUrl(row.image_url);
  return {
    id,
    name,
    slug,
    description: readOptionalText(row.description),
    priceLabel: cataloguePriceLabel({
      priceCents: readCents(row.price_cents),
      variantCount,
      minVariantPriceCents: readCents(row.min_price_cents),
      maxVariantPriceCents: readCents(row.max_price_cents),
    }),
    availabilityLabel: availabilityLabel(available),
    soldOut: available <= 0,
    imageUrl,
    imageAlt: imageUrl ? readOptionalText(row.image_alt) || name : '',
  };
}

function mapProduct(row: Record<string, unknown>): ShopProduct {
  const id = readUuid(row.id);
  const name = readText(row.name);
  const slug = readText(row.slug);
  const available = readCount(row.available_quantity);
  if (!id || !name || !slug || available === null || typeof row.requires_shipping !== 'boolean') {
    throw new Error('Shop product query failed');
  }

  return {
    id,
    name,
    slug,
    description: readOptionalText(row.description),
    priceCents: readCents(row.price_cents),
    requiresShipping: row.requires_shipping,
    available,
    variants: readJsonArray(row.variants).flatMap((entry) => {
      const variant = mapVariant(entry);
      return variant ? [variant] : [];
    }),
    images: readJsonArray(row.images).flatMap((entry) => {
      const image = mapImage(entry);
      return image ? [image] : [];
    }),
  };
}

function mapVariant(value: unknown): ShopVariant | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = readUuid(row.id);
  const name = readText(row.name);
  const priceCents = readCents(row.price_cents);
  const available = readCount(row.available);
  if (!id || !name || priceCents === null || available === null) {
    return null;
  }
  return { id, name, priceCents, available };
}

function mapImage(value: unknown): ShopImage | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = readUuid(row.id);
  const url = readHttpsUrl(row.url);
  const variantId = row.variant_id === null ? null : readUuid(row.variant_id);
  if (!id || !url || (row.variant_id !== null && !variantId)) {
    return null;
  }
  return {
    id,
    variantId,
    url,
    alt: readOptionalText(row.alt),
  };
}

function mapCartRow(row: Record<string, unknown>): CartCatalogRow {
  const productId = readUuid(row.product_id);
  if (!productId) {
    throw new Error('Shop cart preview failed');
  }

  const variantId = row.variant_id === null ? null : readUuid(row.variant_id);
  if (row.variant_id !== null && !variantId) {
    throw new Error('Shop cart preview failed');
  }

  return {
    productId,
    variantId,
    productFound: row.product_found === true,
    active: row.product_active === true,
    hasVariants: row.has_variants === true,
    variantFound: row.variant_found === true,
    variantActive: row.variant_active === true,
    productName: readText(row.product_name),
    variantName: readText(row.variant_name),
    slug: readText(row.slug),
    priceCents: readCents(row.price_cents),
    available: readCount(row.available) ?? 0,
    imageUrl: readHttpsUrl(row.image_url),
    imageAlt: readOptionalText(row.image_alt),
  };
}

function readJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readUuid(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalised = value.toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalised)
    ? normalised
    : null;
}

function readText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function readOptionalText(value: unknown): string {
  return readText(value) ?? '';
}

function readCents(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const cents = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(cents) || cents < 0) {
    return null;
  }
  return cents;
}

function readCount(value: unknown): number | null {
  return readCents(value);
}

function readHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
