-- Newcastle Digest shop.
-- Apply this file in one transaction with the direct connection
-- (NEON_DATABASE_URL_UNPOOLED). It does not create logins, customer accounts,
-- or anything used by reader support, Sanity, or Beehiiv.
--
-- Money is integer AUD cents. Currency is aud. Card data is not stored.
-- A refund does not change stock and does not create a return.
--
-- The checks below decide whether a transaction can commit. They do not issue
-- the stock, payment, or webhook writes. Application transactions that change
-- those rows must follow the lock order and statement order in this header.
--
-- Lock order whenever a transaction touches more than one of these:
--   1. inventory rows, SELECT ... FOR UPDATE, ascending inventory.id
--   2. an existing payment row, when this transaction refunds it or updates it
--   3. the order row
--   4. reservation, shipment, and return writes
-- A new payment row is inserted after the order lock because it does not
-- exist at step 2. A refund trigger locks the payment itself; if that same
-- transaction also updates the order, lock the payment first and update the
-- order afterward. A deadlock aborts one transaction; it does not commit an
-- oversell.
--
-- Opening stock:
--   lock the product row, insert inventory with on_hand 0 and reserved 0,
--   then in the same transaction insert one restock movement and set on_hand
--   to that quantity. on_hand_after and reserved_after are the running totals
--   after that movement, not a separate copy of the table.
--
-- Reserve, in one transaction, inventory ids ascending:
--   SELECT inventory FOR UPDATE;
--   insert the pending order and its lines;
--   UPDATE inventory SET reserved = reserved + qty
--     WHERE id = :id AND on_hand - reserved >= qty;
--   insert the reservation as active, with expires_at in the future;
--   insert a reserve movement (on_hand_delta 0, reserved_delta +qty).
-- A pending order may later hold an expired or released reservation. Pending
-- does not by itself mean stock is still held.
--
-- Release after expiry or cancellation, in one transaction:
--   SELECT inventory FOR UPDATE;
--   set the reservation to expired or released and set closed_at;
--   UPDATE inventory SET reserved = reserved - qty WHERE reserved >= qty;
--   insert a release movement (on_hand_delta 0, reserved_delta -qty).
-- Nothing here watches the clock. A worker must run this for due rows.
--
-- Renew a released or expired reservation, in one transaction:
--   SELECT inventory FOR UPDATE;
--   set that same row back to active, clear closed_at, and set a future
--   expires_at. Do not insert a second reservation for the line;
--   UPDATE inventory SET reserved = reserved + qty
--     WHERE id = :id AND on_hand - reserved >= qty;
--   insert another reserve movement for +qty.
--
-- Move an active reservation to another inventory row, in one transaction,
-- after locking both inventory ids in ascending order:
--   insert the release movement and decrease reserved on the old row while
--   the reservation still points at that row;
--   then set reservation.inventory_id to the new row;
--   then insert the reserve movement and increase reserved on the new row.
-- The reservation quantity and order line never change. A committed
-- reservation cannot move.
--
-- Confirmed payment, in one transaction:
--   SELECT inventory FOR UPDATE in ascending id order;
--   if a non-failed payment row exists, SELECT it FOR UPDATE;
--   SELECT the order FOR UPDATE;
--   set each active reservation to committed and set closed_at;
--   decrease on_hand and reserved by the line quantity;
--   insert one sale movement per line (both deltas equal -qty);
--   insert the payment as paid, or update the single non-failed payment,
--   with amount_cents equal to the order total and the same currency.
--   Set any missing Checkout Session or Payment Intent id on that same row.
--   Set the order status to paid.
-- checkout.session.completed and payment_intent.succeeded are two event ids
-- for one payment. Both must update that one non-failed payment row.
-- Insert a new payment only when the order has no non-failed payment.
-- A second open payment, a second sale, or a second commit of the same
-- reservation fails and rolls the whole transaction back.
--
-- Webhook boundary. One database transaction covers the claim, the business
-- change, and the processed mark:
--   begin;
--   SELECT the webhook row FOR UPDATE when the event id already exists.
--   If its status is processed, commit and stop.
--   Lock inventory, then an existing payment, then the order, as above.
--   If that order is already paid and its reservations are already
--   committed, do not write stock or payment again.
--   Otherwise apply the payment sequence above.
--   Insert the event as processed, or update processing/failed to processed,
--   with processed_at set, in this same transaction.
--   commit.
-- Do not commit a processing row in an earlier transaction. If a crashed
-- attempt left processing or failed, the retry above takes that row and
-- finishes it. Record a genuine failure only after the business transaction
-- has rolled back, in a later transaction that changes webhook_events only.
-- processed is terminal, so a retry of a finished event cannot repeat the sale.
--
-- Refund, in one transaction. SELECT the payment FOR UPDATE before touching
-- the order. The refund trigger locks that payment again. Insert the refund.
-- Do not change inventory and do not insert a return.
-- Succeeded refunds, taken together, must fit the captured amount. When a
-- refund succeeds, set the payment to partially_refunded or refunded in the
-- same transaction.
--
-- Return, in one transaction, after locking that line's inventory id:
--   increase on_hand;
--   insert a return movement (reserved_delta 0, on_hand_delta +qty);
--   insert a return_items row pointing at that movement.
-- The optional refund link is only a reference.
--
-- Reship, in one transaction, after locking that line's inventory id:
--   insert the shipment item. quantity is every unit in the parcel.
--   replacement_quantity is the part that replaces a return; the remainder
--   is still part of the original order. Decrease on_hand by
--   replacement_quantity and insert a reship movement for that decrease.
-- Original units shipped cannot exceed the order line. Replacement units
-- cannot exceed units already returned. A refund alone does neither.

begin;

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  status text not null default 'draft',
  price_cents integer,
  sku text,
  currency char(3) not null default 'aud',
  requires_shipping boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_status_known
    check (status in ('draft', 'active', 'archived')),
  constraint products_currency_aud
    check (currency = 'aud'),
  constraint products_price_nonnegative
    check (price_cents is null or price_cents >= 0),
  constraint products_sku_present
    check (sku is null or char_length(sku) > 0),
  constraint products_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index products_slug_key on products (slug);
create unique index products_sku_key on products (lower(sku)) where sku is not null;

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete restrict,
  name text not null,
  sku text not null,
  price_cents integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_price_nonnegative
    check (price_cents >= 0),
  constraint product_variants_sku_present
    check (char_length(sku) > 0),
  constraint product_variants_product_id_key unique (product_id, id)
);

create unique index product_variants_sku_key on product_variants (lower(sku));
create index product_variants_product_id_idx on product_variants (product_id);

create table sku_claims (
  sku_key text primary key,
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  constraint sku_claims_key_lowercase
    check (sku_key = lower(sku_key) and char_length(sku_key) > 0),
  constraint sku_claims_variant_product_fkey
    foreign key (product_id, variant_id)
    references product_variants (product_id, id)
    on delete cascade
);

create unique index sku_claims_one_product_sku
  on sku_claims (product_id)
  where variant_id is null;

create unique index sku_claims_one_variant_sku
  on sku_claims (variant_id)
  where variant_id is not null;

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_https
    check (url ~ '^https://'),
  constraint product_images_sort_nonnegative
    check (sort_order >= 0),
  constraint product_images_variant_product_fkey
    foreign key (product_id, variant_id)
    references product_variants (product_id, id)
    on delete cascade
);

create index product_images_product_sort_idx
  on product_images (product_id, sort_order);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete restrict,
  variant_id uuid,
  on_hand integer not null,
  reserved integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_on_hand_nonnegative
    check (on_hand >= 0),
  constraint inventory_reserved_nonnegative
    check (reserved >= 0),
  constraint inventory_reserved_within_on_hand
    check (reserved <= on_hand),
  constraint inventory_variant_product_fkey
    foreign key (product_id, variant_id)
    references product_variants (product_id, id)
    on delete restrict
);

create unique index inventory_simple_product_key
  on inventory (product_id)
  where variant_id is null;

create unique index inventory_variant_key
  on inventory (variant_id)
  where variant_id is not null;

create index inventory_product_id_idx on inventory (product_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) not null unique,
  status text not null default 'pending',
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  currency char(3) not null default 'aud',
  subtotal_cents integer not null,
  shipping_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null,
  stripe_checkout_session_id text,
  ship_name text not null,
  ship_line1 text not null,
  ship_line2 text not null default '',
  ship_city text not null,
  ship_state text not null,
  ship_postcode text not null,
  ship_country char(2) not null default 'AU',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_known
    check (status in (
      'pending',
      'paid',
      'partially_fulfilled',
      'fulfilled',
      'cancelled',
      'partially_refunded',
      'refunded'
    )),
  constraint orders_currency_aud
    check (currency = 'aud'),
  constraint orders_subtotal_nonnegative
    check (subtotal_cents >= 0),
  constraint orders_shipping_nonnegative
    check (shipping_cents >= 0),
  constraint orders_discount_nonnegative
    check (discount_cents >= 0),
  constraint orders_total_nonnegative
    check (total_cents >= 0),
  constraint orders_total_equation
    check (total_cents = subtotal_cents + shipping_cents - discount_cents),
  constraint orders_email_shape
    check (
      customer_email = lower(customer_email)
      and position('@' in customer_email) > 1
      and char_length(customer_email) <= 320
    ),
  constraint orders_checkout_session_present
    check (
      stripe_checkout_session_id is null
      or char_length(stripe_checkout_session_id) > 0
    ),
  constraint orders_postcode_present
    check (char_length(ship_postcode) between 1 and 16),
  constraint orders_country_code
    check (ship_country ~ '^[A-Z]{2}$')
);

create unique index orders_checkout_session_key
  on orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index orders_status_created_idx on orders (status, created_at desc);
create index orders_customer_email_idx on orders (customer_email);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  product_id uuid not null references products (id) on delete restrict,
  variant_id uuid,
  product_name text not null,
  variant_name text not null default '',
  sku text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive
    check (quantity > 0),
  constraint order_items_price_nonnegative
    check (unit_price_cents >= 0),
  constraint order_items_sku_present
    check (char_length(sku) > 0),
  constraint order_items_name_present
    check (char_length(product_name) > 0),
  constraint order_items_variant_product_fkey
    foreign key (product_id, variant_id)
    references product_variants (product_id, id)
    on delete restrict
);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency char(3) not null default 'aud',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_known
    check (status in ('pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
  constraint payments_currency_aud
    check (currency = 'aud'),
  constraint payments_amount_nonnegative
    check (amount_cents >= 0),
  constraint payments_checkout_session_present
    check (
      stripe_checkout_session_id is null
      or char_length(stripe_checkout_session_id) > 0
    ),
  constraint payments_payment_intent_present
    check (
      stripe_payment_intent_id is null
      or char_length(stripe_payment_intent_id) > 0
    )
);

create unique index payments_checkout_session_key
  on payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index payments_payment_intent_key
  on payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index payments_one_open_per_order
  on payments (order_id)
  where status <> 'failed';

create index payments_order_id_idx on payments (order_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id) on delete restrict,
  order_id uuid not null references orders (id) on delete restrict,
  stripe_refund_id text not null,
  amount_cents integer not null,
  currency char(3) not null default 'aud',
  status text not null default 'pending',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refunds_stripe_id_unique unique (stripe_refund_id),
  constraint refunds_stripe_id_present
    check (char_length(stripe_refund_id) > 0),
  constraint refunds_amount_positive
    check (amount_cents > 0),
  constraint refunds_currency_aud
    check (currency = 'aud'),
  constraint refunds_status_known
    check (status in ('pending', 'requires_action', 'succeeded', 'failed', 'canceled'))
);

create index refunds_payment_id_idx on refunds (payment_id);
create index refunds_order_id_idx on refunds (order_id);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  status text not null default 'pending',
  carrier text,
  tracking_number text,
  tracking_url text,
  postage_cents integer,
  purchased_at timestamptz,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipments_status_known
    check (status in ('pending', 'purchased', 'dispatched')),
  constraint shipments_postage_nonnegative
    check (postage_cents is null or postage_cents >= 0),
  constraint shipments_postage_when_purchased
    check (status = 'pending' or postage_cents is not null),
  constraint shipments_dispatch_details
    check (
      status <> 'dispatched'
      or (
        carrier is not null
        and char_length(carrier) > 0
        and tracking_number is not null
        and char_length(tracking_number) > 0
        and dispatched_at is not null
        and postage_cents is not null
      )
    ),
  constraint shipments_tracking_url_https
    check (tracking_url is null or tracking_url ~ '^https://')
);

create index shipments_order_id_idx on shipments (order_id);

create table shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments (id) on delete restrict,
  order_item_id uuid not null references order_items (id) on delete restrict,
  quantity integer not null,
  replacement_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shipment_items_quantity_positive
    check (quantity > 0),
  constraint shipment_items_replacement_bounds
    check (replacement_quantity >= 0 and replacement_quantity <= quantity),
  constraint shipment_items_line_once unique (shipment_id, order_item_id)
);

create index shipment_items_shipment_id_idx on shipment_items (shipment_id);
create index shipment_items_order_item_id_idx on shipment_items (order_item_id);

create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory (id) on delete restrict,
  order_id uuid not null references orders (id) on delete restrict,
  order_item_id uuid not null unique references order_items (id) on delete restrict,
  quantity integer not null,
  status text not null default 'active',
  stripe_checkout_session_id text,
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_reservations_quantity_positive
    check (quantity > 0),
  constraint inventory_reservations_status_known
    check (status in ('active', 'committed', 'released', 'expired')),
  constraint inventory_reservations_closed_at_shape
    check (
      (status = 'active' and closed_at is null)
      or (status <> 'active' and closed_at is not null)
    ),
  constraint inventory_reservations_session_present
    check (
      stripe_checkout_session_id is null
      or char_length(stripe_checkout_session_id) > 0
    )
);

create index inventory_reservations_inventory_id_idx
  on inventory_reservations (inventory_id);

create index inventory_reservations_order_id_idx
  on inventory_reservations (order_id);

create index inventory_reservations_active_expiry_idx
  on inventory_reservations (expires_at)
  where status = 'active';

create index inventory_reservations_session_idx
  on inventory_reservations (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity not null unique,
  inventory_id uuid not null references inventory (id) on delete restrict,
  reservation_id uuid references inventory_reservations (id) on delete restrict,
  order_id uuid references orders (id) on delete restrict,
  order_item_id uuid references order_items (id) on delete restrict,
  refund_id uuid references refunds (id) on delete restrict,
  movement_type text not null,
  on_hand_delta integer not null,
  reserved_delta integer not null,
  on_hand_after integer not null,
  reserved_after integer not null,
  note text,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_known
    check (movement_type in (
      'reserve', 'release', 'sale', 'restock', 'adjustment', 'return', 'reship'
    )),
  constraint inventory_movements_type_shape
    check (
      (
        movement_type = 'reserve'
        and on_hand_delta = 0
        and reserved_delta > 0
        and reservation_id is not null
        and order_item_id is null
      )
      or (
        movement_type = 'release'
        and on_hand_delta = 0
        and reserved_delta < 0
        and reservation_id is not null
        and order_item_id is null
      )
      or (
        movement_type = 'sale'
        and on_hand_delta < 0
        and reserved_delta = on_hand_delta
        and reservation_id is not null
        and order_item_id is not null
      )
      or (
        movement_type = 'restock'
        and on_hand_delta > 0
        and reserved_delta = 0
        and reservation_id is null
        and order_item_id is null
      )
      or (
        movement_type = 'return'
        and on_hand_delta > 0
        and reserved_delta = 0
        and reservation_id is null
        and order_item_id is not null
      )
      or (
        movement_type = 'reship'
        and on_hand_delta < 0
        and reserved_delta = 0
        and reservation_id is null
        and order_item_id is not null
      )
      or (
        movement_type = 'adjustment'
        and on_hand_delta <> 0
        and reserved_delta = 0
        and reservation_id is null
        and order_item_id is null
      )
    ),
  constraint inventory_movements_on_hand_after_nonnegative
    check (on_hand_after >= 0),
  constraint inventory_movements_reserved_after_nonnegative
    check (reserved_after >= 0),
  constraint inventory_movements_reserved_after_within_on_hand
    check (reserved_after <= on_hand_after)
);

create unique index inventory_movements_one_sale_per_reservation
  on inventory_movements (reservation_id)
  where movement_type = 'sale';

create index inventory_movements_inventory_seq_idx
  on inventory_movements (inventory_id, seq);

create index inventory_movements_reservation_id_idx
  on inventory_movements (reservation_id)
  where reservation_id is not null;

create index inventory_movements_order_item_id_idx
  on inventory_movements (order_item_id)
  where order_item_id is not null;

create index inventory_movements_order_id_idx
  on inventory_movements (order_id)
  where order_id is not null;

create table return_items (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items (id) on delete restrict,
  inventory_movement_id uuid not null unique references inventory_movements (id) on delete restrict,
  refund_id uuid references refunds (id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now(),
  constraint return_items_quantity_positive
    check (quantity > 0)
);

create index return_items_order_item_id_idx on return_items (order_item_id);
create index return_items_refund_id_idx on return_items (refund_id) where refund_id is not null;

create table webhook_events (
  id text primary key,
  event_type text not null,
  status text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  constraint webhook_events_id_present
    check (char_length(id) > 0),
  constraint webhook_events_type_present
    check (char_length(event_type) > 0),
  constraint webhook_events_status_known
    check (status in ('processing', 'processed', 'failed')),
  constraint webhook_events_processed_at_shape
    check (status <> 'processed' or processed_at is not null)
);

create index webhook_events_received_at_idx on webhook_events (received_at desc);

create table email_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  shipment_id uuid references shipments (id) on delete restrict,
  email_type text not null,
  recipient_email text not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_deliveries_type_known
    check (email_type in ('order_confirmation', 'dispatch')),
  constraint email_deliveries_type_target
    check (
      (email_type = 'order_confirmation' and shipment_id is null)
      or (email_type = 'dispatch' and shipment_id is not null)
    ),
  constraint email_deliveries_status_known
    check (status in ('pending', 'sent', 'failed')),
  constraint email_deliveries_attempts_nonnegative
    check (attempt_count >= 0),
  constraint email_deliveries_sent_at_shape
    check (status <> 'sent' or sent_at is not null),
  constraint email_deliveries_email_shape
    check (
      recipient_email = lower(recipient_email)
      and position('@' in recipient_email) > 1
      and char_length(recipient_email) <= 320
    )
);

create unique index email_deliveries_confirmation_key
  on email_deliveries (order_id)
  where email_type = 'order_confirmation';

create unique index email_deliveries_dispatch_key
  on email_deliveries (shipment_id)
  where email_type = 'dispatch';

create index email_deliveries_order_id_idx on email_deliveries (order_id);

create function shop_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function shop_status_is_paid(order_status text)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select order_status in (
    'paid',
    'partially_fulfilled',
    'fulfilled',
    'partially_refunded',
    'refunded'
  );
$$;

create function shop_lock_product(target_product uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform 1 from products where id = target_product for update;
  if not found then
    raise exception 'product % does not exist', target_product;
  end if;
end;
$$;

create function shop_lock_inventory(target_inventory uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform 1 from inventory where id = target_inventory for update;
  if not found then
    raise exception 'inventory % does not exist', target_inventory;
  end if;
end;
$$;

create function shop_lock_inventory_pair(first_inventory uuid, second_inventory uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if second_inventory is null or first_inventory = second_inventory then
    perform shop_lock_inventory(first_inventory);
  elsif first_inventory < second_inventory then
    perform shop_lock_inventory(first_inventory);
    perform shop_lock_inventory(second_inventory);
  else
    perform shop_lock_inventory(second_inventory);
    perform shop_lock_inventory(first_inventory);
  end if;
end;
$$;

create function shop_lock_order_item(target_line uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform 1 from order_items where id = target_line for update;
  if not found then
    raise exception 'order item % does not exist', target_line;
  end if;
end;
$$;

create function shop_inventory_for_line(target_line uuid)
returns uuid
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  found_inventory uuid;
begin
  select inventory.id
  into found_inventory
  from order_items
  join inventory
    on inventory.product_id = order_items.product_id
   and inventory.variant_id is not distinct from order_items.variant_id
  where order_items.id = target_line;

  if not found then
    raise exception 'order item % has no inventory row', target_line;
  end if;

  return found_inventory;
end;
$$;

create function shop_sync_sku()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  owner_product uuid;
  owner_variant uuid;
  new_key text;
begin
  if tg_op = 'DELETE' then
    if old.sku is not null then
      delete from sku_claims where sku_key = lower(old.sku);
    end if;
    return old;
  end if;

  if tg_table_name = 'products' then
    owner_product := new.id;
    owner_variant := null;
    new_key := case when new.sku is null then null else lower(new.sku) end;
  else
    owner_product := new.product_id;
    owner_variant := new.id;
    new_key := lower(new.sku);
  end if;

  if tg_op = 'UPDATE'
     and old.sku is not null
     and lower(old.sku) is distinct from new_key then
    delete from sku_claims where sku_key = lower(old.sku);
  end if;

  if new_key is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.sku is not null and lower(old.sku) = new_key then
    if tg_table_name = 'product_variants' then
      if new.product_id is distinct from old.product_id then
        update sku_claims
        set product_id = owner_product,
            variant_id = owner_variant
        where sku_key = new_key;
      end if;
    end if;
    return new;
  end if;

  begin
    insert into sku_claims (sku_key, product_id, variant_id)
    values (new_key, owner_product, owner_variant);
  exception
    when unique_violation then
      raise exception 'sku % is already in use', new.sku;
  end;

  return new;
end;
$$;

create function shop_guard_variant_shape()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  parent_price integer;
  parent_sku text;
begin
  if tg_op = 'DELETE' then
    perform shop_lock_product(old.product_id);
    return old;
  end if;

  perform shop_lock_product(new.product_id);

  select price_cents, sku
  into parent_price, parent_sku
  from products
  where id = new.product_id;

  if parent_price is not null or parent_sku is not null then
    raise exception 'clear the product price and sku before adding variants to %', new.product_id;
  end if;

  if exists (
    select 1
    from inventory
    where product_id = new.product_id
      and variant_id is null
  ) then
    raise exception 'product % is already stocked without variants', new.product_id;
  end if;

  return new;
end;
$$;

create function shop_guard_product_shape()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (select 1 from product_variants where product_id = new.id)
     and (new.price_cents is not null or new.sku is not null) then
    raise exception 'product % keeps its price and sku on variants', new.id;
  end if;

  return new;
end;
$$;

create function shop_guard_inventory_shape()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if old.on_hand <> 0 or old.reserved <> 0 then
      raise exception 'cannot delete inventory % while stock remains', old.id;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE'
     and (
       new.product_id is distinct from old.product_id
       or new.variant_id is distinct from old.variant_id
     ) then
    raise exception 'inventory % cannot move to a different product or variant', old.id;
  end if;

  if tg_op = 'INSERT' then
    perform shop_lock_product(new.product_id);

    if new.variant_id is null
       and exists (select 1 from product_variants where product_id = new.product_id) then
      raise exception 'product % has variants; stock belongs on the variants', new.product_id;
    end if;

    if new.variant_id is not null
       and exists (
         select 1
         from inventory
         where product_id = new.product_id
           and variant_id is null
       ) then
      raise exception 'product % is already stocked without variants', new.product_id;
    end if;
  end if;

  return new;
end;
$$;

create function shop_assert_product_consistency()
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
begin
  pid := case tg_table_name
    when 'products' then coalesce(new.id, old.id)
    when 'product_variants' then coalesce(new.product_id, old.product_id)
    else coalesce(new.product_id, old.product_id)
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

create function shop_recheck_inventory(target_inventory uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  live_hand integer;
  live_held integer;
  hand integer := 0;
  held integer := 0;
  active_qty bigint;
  movement record;
begin
  select on_hand, reserved
  into live_hand, live_held
  from inventory
  where id = target_inventory;

  if not found then
    if exists (
      select 1 from inventory_movements where inventory_id = target_inventory
    ) or exists (
      select 1
      from inventory_reservations
      where inventory_id = target_inventory
        and status = 'active'
    ) then
      raise exception 'inventory % was removed while stock history remains', target_inventory;
    end if;
    return;
  end if;

  for movement in
    select on_hand_delta, reserved_delta, on_hand_after, reserved_after
    from inventory_movements
    where inventory_id = target_inventory
    order by seq
  loop
    hand := hand + movement.on_hand_delta;
    held := held + movement.reserved_delta;
    if movement.on_hand_after <> hand or movement.reserved_after <> held then
      raise exception 'inventory movement for % does not continue the stock ledger', target_inventory;
    end if;
  end loop;

  if live_hand <> hand or live_held <> held then
    raise exception
      'inventory % has % on hand and % reserved, but its movements total % and %',
      target_inventory, live_hand, live_held, hand, held;
  end if;

  select coalesce(sum(quantity), 0)
  into active_qty
  from inventory_reservations
  where inventory_id = target_inventory
    and status = 'active';

  if live_held::bigint <> active_qty then
    raise exception
      'reserved stock (%) does not match active reservations (%) for inventory %',
      live_held, active_qty, target_inventory;
  end if;
end;
$$;

create function shop_check_reservation_ledger(target_reservation uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  reservation_status text;
  reservation_qty integer;
  hand_delta bigint;
  held_delta bigint;
  sale_count bigint;
  reserve_count bigint;
begin
  select status, quantity
  into reservation_status, reservation_qty
  from inventory_reservations
  where id = target_reservation;

  if not found then
    return;
  end if;

  select
    coalesce(sum(on_hand_delta), 0),
    coalesce(sum(reserved_delta), 0),
    count(*) filter (where movement_type = 'sale'),
    count(*) filter (where movement_type = 'reserve')
  into hand_delta, held_delta, sale_count, reserve_count
  from inventory_movements
  where reservation_id = target_reservation;

  if reservation_status = 'active' then
    if hand_delta <> 0
       or held_delta <> reservation_qty::bigint
       or sale_count <> 0
       or reserve_count < 1 then
      raise exception 'active reservation % does not match its stock movements', target_reservation;
    end if;
  elsif reservation_status in ('released', 'expired') then
    if hand_delta <> 0 or held_delta <> 0 or sale_count <> 0 or reserve_count < 1 then
      raise exception 'closed reservation % still changes stock', target_reservation;
    end if;
  elsif reservation_status = 'committed' then
    if hand_delta <> -reservation_qty::bigint
       or held_delta <> 0
       or sale_count <> 1
       or reserve_count < 1 then
      raise exception 'committed reservation % was not sold exactly once', target_reservation;
    end if;
  else
    raise exception 'unknown reservation status %', reservation_status;
  end if;
end;
$$;

create function shop_check_order_stock(target_order uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  order_status text;
  line record;
begin
  select status
  into order_status
  from orders
  where id = target_order;

  if not found then
    return;
  end if;

  for line in
    select order_items.id as line_id, inventory_reservations.id as reservation_id, inventory_reservations.status as reservation_status
    from order_items
    left join inventory_reservations
      on inventory_reservations.order_item_id = order_items.id
    where order_items.order_id = target_order
  loop
    if line.reservation_id is null then
      raise exception 'order line % has no inventory reservation', line.line_id;
    end if;

    if shop_status_is_paid(order_status) then
      if line.reservation_status <> 'committed' then
        raise exception 'paid order % has uncommitted stock for line %', target_order, line.line_id;
      end if;
    elsif order_status = 'cancelled' then
      if line.reservation_status not in ('released', 'expired') then
        raise exception 'cancelled order % still holds or sells stock for line %', target_order, line.line_id;
      end if;
    elsif order_status = 'pending' then
      if line.reservation_status = 'committed' then
        raise exception 'pending order % has committed stock for line %', target_order, line.line_id;
      end if;
    else
      raise exception 'unknown order status %', order_status;
    end if;

    perform shop_check_reservation_ledger(line.reservation_id);
  end loop;
end;
$$;

create function shop_check_order_settlement(target_order uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  order_status text;
  order_total integer;
  order_currency char(3);
  order_session text;
  pay_id uuid;
  pay_status text;
  pay_amount integer;
  pay_currency char(3);
  pay_session text;
  open_payments bigint;
  succeeded_refunds bigint;
begin
  select status, total_cents, currency, stripe_checkout_session_id
  into order_status, order_total, order_currency, order_session
  from orders
  where id = target_order;

  if not found then
    return;
  end if;

  select count(*)
  into open_payments
  from payments
  where order_id = target_order
    and status <> 'failed';

  if open_payments > 1 then
    raise exception 'order % has more than one open payment', target_order;
  end if;

  select id, status, amount_cents, currency, stripe_checkout_session_id
  into pay_id, pay_status, pay_amount, pay_currency, pay_session
  from payments
  where order_id = target_order
    and status <> 'failed';

  if found then
    if pay_amount <> order_total or pay_currency <> order_currency then
      raise exception 'payment for order % does not match the order total or currency', target_order;
    end if;
    if pay_session is not null
       and order_session is not null
       and pay_session is distinct from order_session then
      raise exception 'payment session for order % does not match the order', target_order;
    end if;

    select coalesce(sum(amount_cents) filter (where status = 'succeeded'), 0)
    into succeeded_refunds
    from refunds
    where payment_id = pay_id;

    if pay_status = 'pending' and exists (
      select 1 from refunds where payment_id = pay_id
    ) then
      raise exception 'pending payment % cannot have refunds', pay_id;
    elsif pay_status = 'paid' and succeeded_refunds <> 0 then
      raise exception 'payment % is still paid but has succeeded refunds', pay_id;
    elsif pay_status = 'partially_refunded'
      and (succeeded_refunds <= 0 or succeeded_refunds >= pay_amount::bigint) then
      raise exception 'payment % does not match its succeeded refunds', pay_id;
    elsif pay_status = 'refunded' and succeeded_refunds <> pay_amount::bigint then
      raise exception 'payment % is refunded but succeeded refunds do not equal it', pay_id;
    end if;
  end if;

  if shop_status_is_paid(order_status) then
    if pay_status is null or pay_status not in ('paid', 'partially_refunded', 'refunded') then
      raise exception 'paid order % needs one successful payment', target_order;
    end if;
  elsif pay_status in ('paid', 'partially_refunded', 'refunded') then
    raise exception 'order % has a successful payment but is not paid', target_order;
  end if;
end;
$$;

create function shop_check_fulfilment(target_line uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  ordered integer;
  shipped bigint;
  replacements bigint;
  returned bigint;
  reshipped bigint;
begin
  select quantity
  into ordered
  from order_items
  where id = target_line;

  if not found then
    return;
  end if;

  select coalesce(sum(quantity), 0), coalesce(sum(replacement_quantity), 0)
  into shipped, replacements
  from shipment_items
  where order_item_id = target_line;

  select coalesce(sum(quantity), 0)
  into returned
  from return_items
  where order_item_id = target_line;

  select coalesce(sum(-on_hand_delta), 0)
  into reshipped
  from inventory_movements
  where order_item_id = target_line
    and movement_type = 'reship';

  if returned > shipped then
    raise exception 'returns exceed shipped units for order line %', target_line;
  end if;

  if shipped - replacements > ordered::bigint then
    raise exception 'original shipments exceed order line %', target_line;
  end if;

  if replacements > returned then
    raise exception 'replacement shipments exceed returned units for order line %', target_line;
  end if;

  if reshipped <> replacements then
    raise exception 'reship stock for order line % does not match replacement units', target_line;
  end if;
end;
$$;

create function shop_require_dispatched_items(target_shipment uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  shipment_status text;
begin
  select status
  into shipment_status
  from shipments
  where id = target_shipment;

  if shipment_status is distinct from 'dispatched' then
    return;
  end if;

  if not exists (select 1 from shipment_items where shipment_id = target_shipment) then
    raise exception 'dispatched shipment % needs at least one item', target_shipment;
  end if;
end;
$$;

create function shop_reservation_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  line_order uuid;
  line_qty integer;
  line_product uuid;
  line_variant uuid;
  inv_product uuid;
  inv_variant uuid;
begin
  if tg_op = 'DELETE' then
    raise exception 'reservations cannot be deleted';
  end if;

  if tg_op = 'UPDATE' then
    perform shop_lock_inventory_pair(old.inventory_id, new.inventory_id);
  else
    perform shop_lock_inventory(new.inventory_id);
  end if;

  if tg_op = 'INSERT' and new.status <> 'active' then
    raise exception 'reservations are created active';
  end if;

  if tg_op = 'UPDATE'
     and (
       new.quantity is distinct from old.quantity
       or new.order_id is distinct from old.order_id
       or new.order_item_id is distinct from old.order_item_id
     ) then
    raise exception 'reservation quantity and order line cannot change';
  end if;

  if tg_op = 'UPDATE' and old.status = 'committed' then
    if new.status is distinct from old.status
       or new.inventory_id is distinct from old.inventory_id then
      raise exception 'committed reservation % cannot be changed', old.id;
    end if;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'active' and new.status in ('committed', 'released', 'expired') then
      null;
    elsif old.status in ('released', 'expired') and new.status = 'active' then
      null;
    else
      raise exception 'invalid reservation transition from % to %', old.status, new.status;
    end if;
  end if;

  if new.status = 'active' and new.expires_at <= now() then
    raise exception 'reservation % needs an expiry in the future', new.id;
  end if;

  select order_id, quantity, product_id, variant_id
  into line_order, line_qty, line_product, line_variant
  from order_items
  where id = new.order_item_id;

  if line_order is distinct from new.order_id then
    raise exception 'reservation % is for a different order than its line', new.id;
  end if;

  if line_qty is distinct from new.quantity then
    raise exception 'reservation % quantity does not match its order line', new.id;
  end if;

  select product_id, variant_id
  into inv_product, inv_variant
  from inventory
  where id = new.inventory_id;

  if inv_product is distinct from line_product
     or inv_variant is distinct from line_variant then
    raise exception 'reservation % holds a different product than its order line', new.id;
  end if;

  return new;
end;
$$;

create function shop_reservation_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_recheck_inventory(new.inventory_id);
  if tg_op = 'UPDATE' and old.inventory_id is distinct from new.inventory_id then
    perform shop_recheck_inventory(old.inventory_id);
  end if;
  perform shop_check_reservation_ledger(new.id);
  perform shop_check_order_stock(new.order_id);
  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
    perform shop_check_order_stock(old.order_id);
  end if;
  return null;
end;
$$;

create function shop_inventory_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_recheck_inventory(coalesce(new.id, old.id));
  return null;
end;
$$;

create function shop_order_item_shape()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_lock_product(new.product_id);

  if exists (select 1 from product_variants where product_id = new.product_id) then
    if new.variant_id is null then
      raise exception 'product % is sold by variant', new.product_id;
    end if;
  elsif new.variant_id is not null then
    raise exception 'product % has no variants', new.product_id;
  end if;

  return new;
end;
$$;

create function shop_order_item_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'order lines cannot be deleted';
  end if;

  if new.order_id is distinct from old.order_id
     or new.product_id is distinct from old.product_id
     or new.variant_id is distinct from old.variant_id
     or new.product_name is distinct from old.product_name
     or new.variant_name is distinct from old.variant_name
     or new.sku is distinct from old.sku
     or new.quantity is distinct from old.quantity
     or new.unit_price_cents is distinct from old.unit_price_cents
  then
    raise exception 'order line snapshots cannot be changed';
  end if;

  return new;
end;
$$;

create function shop_order_totals_match()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  oid uuid;
  actual integer;
  item_count bigint;
  expected bigint;
begin
  oid := case tg_table_name
    when 'orders' then coalesce(new.id, old.id)
    else coalesce(new.order_id, old.order_id)
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

create function shop_order_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  oid uuid;
begin
  oid := coalesce(new.id, old.id);
  perform shop_check_order_stock(oid);
  perform shop_check_order_settlement(oid);
  return null;
end;
$$;

create function shop_order_item_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_check_order_stock(coalesce(new.order_id, old.order_id));
  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
    perform shop_check_order_stock(old.order_id);
  end if;
  return null;
end;
$$;

create function shop_payment_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'payments cannot be deleted; mark the attempt failed';
  end if;

  if tg_op = 'UPDATE' and new.order_id is distinct from old.order_id then
    raise exception 'a payment cannot move to a different order';
  end if;

  if tg_op = 'UPDATE'
     and old.status in ('paid', 'partially_refunded', 'refunded')
     and (
       new.amount_cents is distinct from old.amount_cents
       or new.currency is distinct from old.currency
       or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
     ) then
    raise exception 'a successful payment cannot change its amount or Stripe ids';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'pending' and new.status in ('paid', 'failed') then
      null;
    elsif old.status = 'failed' and new.status = 'paid' then
      null;
    elsif old.status = 'paid' and new.status in ('partially_refunded', 'refunded') then
      null;
    elsif old.status = 'partially_refunded' and new.status = 'refunded' then
      null;
    else
      raise exception 'invalid payment transition from % to %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

create function shop_payment_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_check_order_settlement(coalesce(new.order_id, old.order_id));
  return null;
end;
$$;

create function shop_refund_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  payment_order uuid;
  payment_status text;
  payment_currency char(3);
  paid integer;
  refunded bigint;
begin
  if tg_op = 'DELETE' then
    raise exception 'refunds cannot be deleted; mark the refund canceled or failed';
  end if;

  if tg_op = 'UPDATE'
     and (
       new.payment_id is distinct from old.payment_id
       or new.order_id is distinct from old.order_id
       or new.stripe_refund_id is distinct from old.stripe_refund_id
     ) then
    raise exception 'a refund cannot move to a different payment';
  end if;

  select order_id, status, currency, amount_cents
  into payment_order, payment_status, payment_currency, paid
  from payments
  where id = new.payment_id
  for update;

  if not found then
    raise exception 'payment % does not exist', new.payment_id;
  end if;

  if payment_status not in ('paid', 'partially_refunded', 'refunded') then
    raise exception 'only a successful payment can be refunded';
  end if;

  if payment_order is distinct from new.order_id then
    raise exception 'refund % is for a different order than its payment', new.id;
  end if;

  if new.currency <> payment_currency then
    raise exception 'refund % currency does not match its payment', new.id;
  end if;

  select coalesce(sum(amount_cents), 0)
  into refunded
  from refunds
  where payment_id = new.payment_id
    and id is distinct from new.id
    and status in ('pending', 'requires_action', 'succeeded');

  if new.status in ('pending', 'requires_action', 'succeeded') then
    refunded := refunded + new.amount_cents;
  end if;

  if refunded > paid::bigint then
    raise exception 'refunds for payment % exceed the amount paid', new.payment_id;
  end if;

  return new;
end;
$$;

create function shop_refund_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  payment_order uuid;
begin
  select order_id
  into payment_order
  from payments
  where id = coalesce(new.payment_id, old.payment_id);

  if found then
    perform shop_check_order_settlement(payment_order);
  end if;

  return null;
end;
$$;

create function shop_shipment_item_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  current_line uuid;
  previous_line uuid;
  current_inventory uuid;
  previous_inventory uuid;
  item_order uuid;
  shipment_order uuid;
begin
  if tg_op = 'DELETE' then
    perform shop_lock_inventory(shop_inventory_for_line(old.order_item_id));
    perform shop_lock_order_item(old.order_item_id);
    return old;
  end if;

  current_line := new.order_item_id;
  previous_line := case
    when tg_op = 'UPDATE' and old.order_item_id is distinct from new.order_item_id then old.order_item_id
    else null
  end;

  current_inventory := shop_inventory_for_line(current_line);
  if previous_line is null then
    perform shop_lock_inventory(current_inventory);
    perform shop_lock_order_item(current_line);
  else
    previous_inventory := shop_inventory_for_line(previous_line);
    perform shop_lock_inventory_pair(current_inventory, previous_inventory);
    if current_line < previous_line then
      perform shop_lock_order_item(current_line);
      perform shop_lock_order_item(previous_line);
    else
      perform shop_lock_order_item(previous_line);
      perform shop_lock_order_item(current_line);
    end if;
  end if;

  select order_id into item_order from order_items where id = current_line;
  select order_id into shipment_order from shipments where id = new.shipment_id;

  if shipment_order is distinct from item_order then
    raise exception 'shipment % belongs to a different order than the line', new.shipment_id;
  end if;

  return new;
end;
$$;

create function shop_shipment_item_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_check_fulfilment(coalesce(new.order_item_id, old.order_item_id));
  if tg_op = 'UPDATE' and old.order_item_id is distinct from new.order_item_id then
    perform shop_check_fulfilment(old.order_item_id);
  end if;
  perform shop_require_dispatched_items(coalesce(new.shipment_id, old.shipment_id));
  if tg_op = 'UPDATE' and old.shipment_id is distinct from new.shipment_id then
    perform shop_require_dispatched_items(old.shipment_id);
  end if;
  return null;
end;
$$;

create function shop_shipment_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_require_dispatched_items(coalesce(new.id, old.id));
  return null;
end;
$$;

create function shop_movement_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  reservation_inventory uuid;
  reservation_order uuid;
  reservation_line uuid;
  reservation_qty integer;
  line_order uuid;
  line_product uuid;
  line_variant uuid;
  line_inventory uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'inventory movements cannot be changed or deleted';
  end if;

  perform shop_lock_inventory(new.inventory_id);

  if new.reservation_id is not null then
    select inventory_id, order_id, order_item_id, quantity
    into reservation_inventory, reservation_order, reservation_line, reservation_qty
    from inventory_reservations
    where id = new.reservation_id;

    if reservation_inventory is distinct from new.inventory_id then
      raise exception 'movement inventory does not match reservation %', new.reservation_id;
    end if;

    if new.order_id is not null and reservation_order is distinct from new.order_id then
      raise exception 'movement order does not match reservation %', new.reservation_id;
    end if;

    if new.movement_type = 'sale'
       and (
         new.on_hand_delta <> -reservation_qty
         or new.reserved_delta <> -reservation_qty
         or new.order_id is distinct from reservation_order
         or new.order_item_id is distinct from reservation_line
       ) then
      raise exception 'sale movement does not match reservation %', new.reservation_id;
    end if;
  end if;

  if new.order_item_id is not null then
    select order_id, product_id, variant_id
    into line_order, line_product, line_variant
    from order_items
    where id = new.order_item_id;

    if new.order_id is not null and new.order_id is distinct from line_order then
      raise exception 'movement order does not match order line %', new.order_item_id;
    end if;

    select id
    into line_inventory
    from inventory
    where product_id = line_product
      and variant_id is not distinct from line_variant;

    if line_inventory is distinct from new.inventory_id then
      raise exception 'movement stock does not match order line %', new.order_item_id;
    end if;
  end if;

  return new;
end;
$$;

create function shop_movement_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_recheck_inventory(new.inventory_id);
  if new.reservation_id is not null then
    perform shop_check_reservation_ledger(new.reservation_id);
  end if;
  if new.order_item_id is not null then
    perform shop_check_fulfilment(new.order_item_id);
  end if;
  if new.movement_type = 'return'
     and not exists (
       select 1
       from return_items
       where inventory_movement_id = new.id
     ) then
    raise exception 'return movement % needs a return item', new.id;
  end if;
  return null;
end;
$$;

create function shop_return_item_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  movement_type text;
  movement_hand integer;
  movement_held integer;
  movement_inventory uuid;
  movement_line uuid;
  movement_order uuid;
  line_order uuid;
begin
  if tg_op = 'DELETE' then
    raise exception 'return items cannot be deleted';
  end if;

  if tg_op = 'UPDATE'
     and (
       new.order_item_id is distinct from old.order_item_id
       or new.inventory_movement_id is distinct from old.inventory_movement_id
       or new.quantity is distinct from old.quantity
     ) then
    raise exception 'return item % cannot change the returned units', old.id;
  end if;

  perform shop_lock_inventory(shop_inventory_for_line(new.order_item_id));
  perform shop_lock_order_item(new.order_item_id);

  select
    inventory_movements.movement_type,
    inventory_movements.on_hand_delta,
    inventory_movements.reserved_delta,
    inventory_movements.inventory_id,
    inventory_movements.order_item_id,
    inventory_movements.order_id
  into movement_type, movement_hand, movement_held, movement_inventory, movement_line, movement_order
  from inventory_movements
  where id = new.inventory_movement_id;

  if movement_type is distinct from 'return'
     or movement_hand is distinct from new.quantity
     or movement_held is distinct from 0
     or movement_line is distinct from new.order_item_id then
    raise exception 'return item % does not match its stock movement', new.id;
  end if;

  if movement_inventory is distinct from shop_inventory_for_line(new.order_item_id) then
    raise exception 'return item % restocks a different product than the order line', new.id;
  end if;

  select order_id into line_order from order_items where id = new.order_item_id;
  if movement_order is not null and movement_order is distinct from line_order then
    raise exception 'return item % belongs to a different order than its movement', new.id;
  end if;

  if new.refund_id is not null and exists (
    select 1
    from refunds
    where id = new.refund_id
      and order_id is distinct from line_order
  ) then
    raise exception 'return item % links a refund from a different order', new.id;
  end if;

  return new;
end;
$$;

create function shop_return_item_effects()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  perform shop_check_fulfilment(new.order_item_id);
  return null;
end;
$$;

create function shop_webhook_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'webhook events cannot be deleted';
  end if;

  if old.status = 'processed' then
    raise exception 'a processed webhook event cannot be changed';
  end if;

  if new.id is distinct from old.id or new.event_type is distinct from old.event_type then
    raise exception 'webhook event id and type cannot change';
  end if;

  if new.status is distinct from old.status
     and not (
       (old.status = 'processing' and new.status in ('processed', 'failed'))
       or (old.status = 'failed' and new.status in ('processing', 'processed'))
     ) then
    raise exception 'invalid webhook transition from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger products_set_updated_at
before update on products
for each row execute function shop_set_updated_at();

create trigger products_guard_shape
before update on products
for each row execute function shop_guard_product_shape();

create trigger products_sync_sku
after insert or update on products
for each row execute function shop_sync_sku();

create trigger products_sync_sku_delete
before delete on products
for each row execute function shop_sync_sku();

create constraint trigger products_consistent
after insert or update or delete on products
deferrable initially deferred
for each row execute function shop_assert_product_consistency();

create trigger product_variants_set_updated_at
before update on product_variants
for each row execute function shop_set_updated_at();

create trigger product_variants_guard_shape
before insert or update or delete on product_variants
for each row execute function shop_guard_variant_shape();

create trigger product_variants_sync_sku
after insert or update on product_variants
for each row execute function shop_sync_sku();

create trigger product_variants_sync_sku_delete
before delete on product_variants
for each row execute function shop_sync_sku();

create constraint trigger product_variants_consistent
after insert or update or delete on product_variants
deferrable initially deferred
for each row execute function shop_assert_product_consistency();

create trigger product_images_set_updated_at
before update on product_images
for each row execute function shop_set_updated_at();

create trigger inventory_set_updated_at
before update on inventory
for each row execute function shop_set_updated_at();

create trigger inventory_guard_shape
before insert or update or delete on inventory
for each row execute function shop_guard_inventory_shape();

create constraint trigger inventory_consistent
after insert or delete on inventory
deferrable initially deferred
for each row execute function shop_assert_product_consistency();

create constraint trigger inventory_matches_ledger
after insert or update or delete on inventory
deferrable initially deferred
for each row execute function shop_inventory_effects();

create trigger orders_set_updated_at
before update on orders
for each row execute function shop_set_updated_at();

create constraint trigger orders_totals_match
after insert or update or delete on orders
deferrable initially deferred
for each row execute function shop_order_totals_match();

create constraint trigger orders_stock_and_payment
after insert or update or delete on orders
deferrable initially deferred
for each row execute function shop_order_effects();

create trigger order_items_shape
before insert on order_items
for each row execute function shop_order_item_shape();

create trigger order_items_immutable
before update or delete on order_items
for each row execute function shop_order_item_immutable();

create constraint trigger order_items_totals_match
after insert or update or delete on order_items
deferrable initially deferred
for each row execute function shop_order_totals_match();

create constraint trigger order_items_stock
after insert or update or delete on order_items
deferrable initially deferred
for each row execute function shop_order_item_effects();

create trigger payments_set_updated_at
before update on payments
for each row execute function shop_set_updated_at();

create trigger payments_guard
before update or delete on payments
for each row execute function shop_payment_guard();

create constraint trigger payments_match_order
after insert or update or delete on payments
deferrable initially deferred
for each row execute function shop_payment_effects();

create trigger refunds_set_updated_at
before update on refunds
for each row execute function shop_set_updated_at();

create trigger refunds_guard
before insert or update or delete on refunds
for each row execute function shop_refund_guard();

create constraint trigger refunds_match_payment
after insert or update or delete on refunds
deferrable initially deferred
for each row execute function shop_refund_effects();

create trigger shipments_set_updated_at
before update on shipments
for each row execute function shop_set_updated_at();

create constraint trigger shipments_dispatched_have_items
after insert or update or delete on shipments
deferrable initially deferred
for each row execute function shop_shipment_effects();

create trigger shipment_items_guard
before insert or update or delete on shipment_items
for each row execute function shop_shipment_item_guard();

create constraint trigger shipment_items_keep_fulfilment_valid
after insert or update or delete on shipment_items
deferrable initially deferred
for each row execute function shop_shipment_item_effects();

create trigger inventory_reservations_set_updated_at
before update on inventory_reservations
for each row execute function shop_set_updated_at();

create trigger inventory_reservations_guard
before insert or update or delete on inventory_reservations
for each row execute function shop_reservation_guard();

create constraint trigger reservations_match_stock
after insert or update on inventory_reservations
deferrable initially deferred
for each row execute function shop_reservation_effects();

create trigger inventory_movements_guard
before insert or update or delete on inventory_movements
for each row execute function shop_movement_guard();

create constraint trigger inventory_movements_match_stock
after insert on inventory_movements
deferrable initially deferred
for each row execute function shop_movement_effects();

create trigger return_items_guard
before insert or update or delete on return_items
for each row execute function shop_return_item_guard();

create constraint trigger return_items_match_fulfilment
after insert or update on return_items
deferrable initially deferred
for each row execute function shop_return_item_effects();

create trigger webhook_events_guard
before update or delete on webhook_events
for each row execute function shop_webhook_guard();

create trigger email_deliveries_set_updated_at
before update on email_deliveries
for each row execute function shop_set_updated_at();

comment on table products is
  'Sellable catalogue. A simple product stores its own price and sku. A product with variants leaves both empty.';
comment on table product_variants is
  'Optional sellable options. Each variant has its own sku and AUD cent price.';
comment on table sku_claims is
  'One row per sku, shared by products and variants, so concurrent catalogue writes cannot claim the same sku.';
comment on table product_images is
  'HTTPS image URLs for a product or one of its variants.';
comment on table inventory is
  'On-hand and reserved units for a simple product or one variant. reserved cannot exceed on_hand.';
comment on table inventory_reservations is
  'One stock hold per order line. Renew a released or expired row in place. Committed is sold exactly once.';
comment on table inventory_movements is
  'Append-only stock ledger. Every supported stock change writes one row in the same transaction. Refunds do not.';
comment on table return_items is
  'Units received back from a customer. Inserting a refund does not insert this row and does not restock.';
comment on table orders is
  'One checkout. Line snapshots and totals are the historical record.';
comment on table order_items is
  'Name, sku, variant, quantity, and unit price copied at purchase. Lines cannot be deleted.';
comment on table payments is
  'One non-failed Stripe payment per order. Failed attempts can remain. No card data.';
comment on table refunds is
  'Stripe refunds. The payment row is locked while the refund total is checked. Inventory is unchanged.';
comment on table shipments is
  'Manual postage. An order may have several shipments, including a replacement after a return.';
comment on table shipment_items is
  'Units from an order line on one shipment. replacement_quantity is the part sent in place of a return; the rest counts toward the original line.';
comment on table webhook_events is
  'Stripe event id. processing and failed can be finished later. processed is terminal.';
comment on table email_deliveries is
  'Order confirmation and dispatch email attempts. No message body or payment details.';

comment on column products.requires_shipping is
  'True when the product must be posted. The order still stores the shipping address and the flat shipping charge.';
comment on column products.price_cents is
  'AUD cents for a product with no variants. Null once the product has variants.';
comment on column orders.shipping_cents is
  'AUD cents charged to the customer. Carrier postage lives on shipments.postage_cents.';
comment on column shipments.postage_cents is
  'AUD cents paid to the carrier for this parcel.';
comment on column shipment_items.replacement_quantity is
  'Units in this parcel that replace a return. The rest of quantity is part of the original order. Stock is decreased only for this replacement quantity.';
comment on column inventory_movements.seq is
  'Insertion order used to check that each movement continues the inventory ledger.';
comment on column inventory_movements.refund_id is
  'Optional link when a return is associated with a refund. The refund itself does not restock.';
comment on column return_items.refund_id is
  'Optional link to a refund. The refund insert does not create this row.';

commit;
