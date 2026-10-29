-- shop_order_totals_match is attached to orders and order_items. PostgreSQL
-- compiles every NEW.column reference in a CASE against the triggering table,
-- so pending order inserts failed at COMMIT with
-- `record "new" has no field "order_id"`. Read NEW/OLD as jsonb so the same
-- function can run on both tables.
--
-- Required on every shop database, including production, after the init
-- migration. CREATE OR REPLACE; it only replaces the broken function.
-- Apply with the direct connection (NEON_DATABASE_URL_UNPOOLED).

begin;

create or replace function shop_order_totals_match()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  oid uuid;
  actual integer;
  item_count bigint;
  expected bigint;
  incoming jsonb := to_jsonb(new);
  outgoing jsonb := to_jsonb(old);
begin
  oid := case tg_table_name
    when 'orders' then coalesce((incoming->>'id')::uuid, (outgoing->>'id')::uuid)
    else coalesce((incoming->>'order_id')::uuid, (outgoing->>'order_id')::uuid)
  end;

  select subtotal_cents into actual from orders where id = oid;
  if not found then
    return null;
  end if;

  select count(*), coalesce(sum(quantity::bigint * unit_price_cents), 0)
  into item_count, expected
  from order_items
  where order_id = oid;

  if item_count = 0 then
    raise exception 'order % needs a line item', oid;
  end if;

  if expected <> actual::bigint then
    raise exception 'order % subtotal % does not match its line items (%)', oid, actual, expected;
  end if;

  return null;
end;
$$;

commit;
