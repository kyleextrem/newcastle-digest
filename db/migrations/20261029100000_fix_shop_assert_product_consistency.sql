-- shop_assert_product_consistency is attached to products, product_variants,
-- and inventory. PostgreSQL compiles every NEW.column reference in a CASE
-- against the triggering table, so product inserts failed at COMMIT with
-- `record "new" has no field "product_id"`. Read NEW/OLD as jsonb so the
-- same function can run on all three tables.
--
-- Required on every shop database, including production, after the init
-- migration. CREATE OR REPLACE; it only replaces the broken function.
-- Apply with the direct connection (NEON_DATABASE_URL_UNPOOLED).

begin;

create or replace function shop_assert_product_consistency()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  pid uuid;
  product_status text;
  product_price integer;
  product_sku text;
  variant_count bigint;
  incoming jsonb := to_jsonb(new);
  outgoing jsonb := to_jsonb(old);
begin
  pid := case tg_table_name
    when 'products' then coalesce((incoming->>'id')::uuid, (outgoing->>'id')::uuid)
    else coalesce((incoming->>'product_id')::uuid, (outgoing->>'product_id')::uuid)
  end;

  if exists (select 1 from product_variants where product_id = pid)
     and exists (
       select 1
       from inventory
       where product_id = pid
         and variant_id is null
     ) then
    raise exception 'product % cannot have both simple-product inventory and variants', pid;
  end if;

  select status, price_cents, sku
  into product_status, product_price, product_sku
  from products
  where id = pid;

  if not found or product_status <> 'active' then
    return null;
  end if;

  select count(*) into variant_count
  from product_variants
  where product_id = pid;

  if variant_count = 0 then
    if product_price is null or product_sku is null then
      raise exception 'active product % needs a price and sku', pid;
    end if;
    if not exists (
      select 1
      from inventory
      where product_id = pid
        and variant_id is null
    ) then
      raise exception 'active product % needs an inventory row', pid;
    end if;
  else
    if product_price is not null or product_sku is not null then
      raise exception 'active product % keeps its price and sku on variants', pid;
    end if;
    if not exists (
      select 1
      from product_variants
      where product_id = pid
        and active
    ) then
      raise exception 'active product % needs an active variant', pid;
    end if;
    if exists (
      select 1
      from product_variants as variant
      where variant.product_id = pid
        and variant.active
        and not exists (
          select 1
          from inventory
          where inventory.variant_id = variant.id
        )
    ) then
      raise exception 'active product % has an active variant without inventory', pid;
    end if;
  end if;

  return null;
end;
$$;

commit;
