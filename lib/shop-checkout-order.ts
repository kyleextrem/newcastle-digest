import 'server-only';

import { randomUUID } from 'node:crypto';
import { transaction, type Sql } from '@/lib/db';
import {
  SHOP_CHECKOUT_CURRENCY,
  SHOP_ORDER_PURPOSE,
  SHOP_RESERVATION_TTL_SECONDS,
  ShopCheckoutError,
  assertFulfillableShopSession,
  normalizeCustomer,
  orderTotals,
  pendingCustomer,
  shopOrderIsPaidStatus,
  type ShopCheckoutLine,
  type ShopSessionSnapshot,
} from '@/lib/shop-checkout';
import type { CartItem } from '@/lib/shop-display';

export type ReservedShopOrder = {
  orderId: string;
  orderNumber: number;
  expiresAt: Date;
  lines: ShopCheckoutLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export type ShopOrderStatusView = {
  orderId: string;
  orderNumber: number;
  status: string;
  paymentStatus: string | null;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paid: boolean;
  cancelled: boolean;
  confirming: boolean;
};

type InventoryLockRow = {
  inventory_id: string | null;
  on_hand: number | null;
  reserved: number | null;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  product_price_cents: number | null;
  requires_shipping: boolean;
  product_status: string | null;
  has_variants: boolean;
  variant_id: string | null;
  variant_name: string | null;
  variant_sku: string | null;
  variant_price_cents: number | null;
  variant_active: boolean;
  requested_quantity: number;
};

type ReservationRow = {
  id: string;
  inventory_id: string;
  order_item_id: string;
  quantity: number;
  status: string;
  on_hand: number;
  reserved: number;
};

export async function reserveShopCart(items: CartItem[]): Promise<ReservedShopOrder> {
  return transaction((sql) => reserveShopCartWithSql(sql, items));
}

export async function reserveShopCartWithSql(sql: Sql, items: CartItem[]): Promise<ReservedShopOrder> {
  const locks = await loadAndLockInventory(sql, items);
  const lines = locks.map(mapLockedLine);
  const totals = orderTotals(lines);
  const orderId = randomUUID();
  const customer = pendingCustomer(orderId, totals.shippingCents > 0);
  const expiresAt = new Date(Date.now() + SHOP_RESERVATION_TTL_SECONDS * 1000);

  const order = await sql<{ id: string; order_number: string }>(
    `
      insert into orders (
        id, status, customer_name, customer_email, customer_phone, currency,
        subtotal_cents, shipping_cents, discount_cents, total_cents,
        ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_postcode, ship_country
      ) values (
        $1, 'pending', $2, $3, null, $4,
        $5, $6, 0, $7,
        $8, $9, '', $10, $11, $12, $13
      )
      returning id, order_number::text
    `,
    [
      orderId,
      customer.name,
      customer.email,
      SHOP_CHECKOUT_CURRENCY,
      totals.subtotalCents,
      totals.shippingCents,
      totals.totalCents,
      customer.shipName,
      customer.shipLine1,
      customer.shipCity,
      customer.shipState,
      customer.shipPostcode,
      customer.shipCountry,
    ],
  );
  const createdId = order.rows[0]?.id;
  const orderNumber = Number(order.rows[0]?.order_number);
  if (!createdId || !Number.isSafeInteger(orderNumber)) {
    throw new ShopCheckoutError('The shop could not start checkout. Try again.');
  }

  for (const line of lines) {
    const item = await sql<{ id: string }>(
      `
        insert into order_items (
          order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price_cents
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning id
      `,
      [
        orderId,
        line.productId,
        line.variantId,
        line.productName,
        line.variantName,
        line.sku,
        line.quantity,
        line.unitPriceCents,
      ],
    );
    const orderItemId = item.rows[0]?.id;
    if (!orderItemId) {
      throw new ShopCheckoutError('The shop could not start checkout. Try again.');
    }
    const reserved = await sql<{ on_hand: number; reserved: number }>(
      `
        update inventory
        set reserved = reserved + $2
        where id = $1
          and on_hand - reserved >= $2
        returning on_hand, reserved
      `,
      [line.inventoryId, line.quantity],
    );
    const stock = reserved.rows[0];
    if (!stock) {
      throw new ShopCheckoutError('There is not enough stock for that cart.');
    }
    const reservation = await sql<{ id: string }>(
      `
        insert into inventory_reservations (
          inventory_id, order_id, order_item_id, quantity, status, expires_at
        ) values ($1, $2, $3, $4, 'active', $5)
        returning id
      `,
      [line.inventoryId, orderId, orderItemId, line.quantity, expiresAt],
    );
    const reservationId = reservation.rows[0]?.id;
    if (!reservationId) {
      throw new ShopCheckoutError('The shop could not start checkout. Try again.');
    }
    await sql(
      `
        insert into inventory_movements (
          inventory_id, reservation_id, order_id, movement_type,
          on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
        ) values ($1, $2, $3, 'reserve', 0, $4, $5, $6, 'Checkout hold')
      `,
      [
        line.inventoryId,
        reservationId,
        orderId,
        line.quantity,
        readCount(stock.on_hand),
        readCount(stock.reserved),
      ],
    );
  }

  await sql(
    `
      insert into payments (order_id, amount_cents, currency, status)
      values ($1, $2, $3, 'pending')
    `,
    [orderId, totals.totalCents, SHOP_CHECKOUT_CURRENCY],
  );

  return {
    orderId,
    orderNumber,
    expiresAt,
    lines,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
  };
}

export async function attachShopCheckoutSession(input: {
  orderId: string;
  sessionId: string;
  expiresAt: Date;
}): Promise<void> {
  await transaction(async (sql) => {
    const updated = await sql(
      `
        update orders
        set stripe_checkout_session_id = $2
        where id = $1
          and status = 'pending'
          and stripe_checkout_session_id is null
      `,
      [input.orderId, input.sessionId],
    );
    if (updated.rowCount !== 1) {
      throw new ShopCheckoutError('That checkout could not be linked.');
    }
    await sql(
      `
        update payments
        set stripe_checkout_session_id = $2
        where order_id = $1
          and status = 'pending'
      `,
      [input.orderId, input.sessionId],
    );
    await sql(
      `
        update inventory_reservations
        set stripe_checkout_session_id = $2,
            expires_at = $3
        where order_id = $1
          and status = 'active'
      `,
      [input.orderId, input.sessionId, input.expiresAt],
    );
  });
}

export async function fulfillShopSession(session: ShopSessionSnapshot): Promise<boolean> {
  if (session.purpose !== SHOP_ORDER_PURPOSE || !session.orderId) {
    return false;
  }
  return transaction((sql) => fulfillShopSessionWithSql(sql, session));
}

export async function fulfillShopSessionWithSql(sql: Sql, session: ShopSessionSnapshot): Promise<boolean> {
  const reservations = await lockReservations(sql, session.orderId ?? '');
  const payment = await lockOpenPayment(sql, session.orderId ?? '');
  const order = await lockOrder(sql, session.orderId ?? '');
  if (!order) {
    throw new ShopCheckoutError('That order could not be found.');
  }
  assertFulfillableShopSession(session, order.total_cents);
  if (session.shippingAmount !== null && session.shippingAmount !== order.shipping_cents) {
    throw new ShopCheckoutError('That payment does not match the order total.');
  }

  if (order.status !== 'pending') {
    if (order.paid) {
      return false;
    }
    throw new ShopCheckoutError('That order can no longer be paid.');
  }

  const customer = normalizeCustomer(session.customer, order.shipping_cents > 0, order.id);
  await sql(
    `
      update orders
      set customer_name = $2,
          customer_email = $3,
          customer_phone = $4,
          stripe_checkout_session_id = coalesce(stripe_checkout_session_id, $5),
          ship_name = $6,
          ship_line1 = $7,
          ship_line2 = $8,
          ship_city = $9,
          ship_state = $10,
          ship_postcode = $11,
          ship_country = $12
      where id = $1
    `,
    [
      order.id,
      customer.name,
      customer.email,
      customer.phone,
      session.id,
      customer.shipName,
      customer.shipLine1,
      customer.shipLine2,
      customer.shipCity,
      customer.shipState,
      customer.shipPostcode,
      customer.shipCountry,
    ],
  );

  for (const reservation of reservations) {
    if (reservation.status === 'committed') {
      continue;
    }
    if (reservation.status === 'released' || reservation.status === 'expired') {
      await renewReservation(sql, reservation);
    } else if (reservation.status !== 'active') {
      throw new ShopCheckoutError('That order can no longer be paid.');
    }

    const sold = await sql<{ on_hand: number; reserved: number }>(
      `
        update inventory
        set on_hand = on_hand - $2,
            reserved = reserved - $2
        where id = $1
          and reserved >= $2
          and on_hand >= $2
        returning on_hand, reserved
      `,
      [reservation.inventory_id, reservation.quantity],
    );
    const stock = sold.rows[0];
    if (!stock) {
      throw new ShopCheckoutError('There is not enough stock for that cart.');
    }
    const committed = await sql(
      `
        update inventory_reservations
        set status = 'committed',
            closed_at = now(),
            stripe_checkout_session_id = coalesce(stripe_checkout_session_id, $2)
        where id = $1
          and status = 'active'
      `,
      [reservation.id, session.id],
    );
    if (committed.rowCount !== 1) {
      throw new ShopCheckoutError('That order can no longer be paid.');
    }
    await sql(
      `
        insert into inventory_movements (
          inventory_id, reservation_id, order_id, order_item_id, movement_type,
          on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
        ) values ($1, $2, $3, $4, 'sale', $5, $5, $6, $7, 'Paid order')
      `,
      [
        reservation.inventory_id,
        reservation.id,
        order.id,
        reservation.order_item_id,
        -reservation.quantity,
        readCount(stock.on_hand),
        readCount(stock.reserved),
      ],
    );
  }

  if (!payment) {
    await sql(
      `
        insert into payments (
          order_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, currency, status
        ) values ($1, $2, $3, $4, $5, 'paid')
      `,
      [order.id, session.id, session.paymentIntentId, order.total_cents, SHOP_CHECKOUT_CURRENCY],
    );
  } else if (payment.status === 'pending' || payment.status === 'failed') {
    await sql(
      `
        update payments
        set status = 'paid',
            stripe_checkout_session_id = coalesce(stripe_checkout_session_id, $2),
            stripe_payment_intent_id = coalesce(stripe_payment_intent_id, $3)
        where id = $1
      `,
      [payment.id, session.id, session.paymentIntentId],
    );
  }

  await sql(`update orders set status = 'paid' where id = $1 and status = 'pending'`, [order.id]);
  return true;
}

export async function cancelShopCheckout(
  orderId: string,
  closure: 'released' | 'expired',
): Promise<void> {
  await transaction((sql) => cancelShopCheckoutWithSql(sql, orderId, closure));
}

export async function cancelShopCheckoutWithSql(
  sql: Sql,
  orderId: string,
  closure: 'released' | 'expired',
): Promise<void> {
  const reservations = await lockReservations(sql, orderId);
  await lockOpenPayment(sql, orderId);
  const order = await lockOrder(sql, orderId);
  if (!order) {
    return;
  }
  if (order.paid) {
    return;
  }

  for (const reservation of reservations) {
    if (reservation.status !== 'active') {
      continue;
    }
    await releaseReservation(sql, reservation, closure, order.id);
  }

  await sql(
    `update payments set status = 'failed' where order_id = $1 and status = 'pending'`,
    [order.id],
  );
  if (order.status === 'pending') {
    await sql(`update orders set status = 'cancelled' where id = $1 and status = 'pending'`, [order.id]);
  }
}

export async function listExpiredActiveCheckouts(): Promise<
  { orderId: string; sessionId: string | null }[]
> {
  return transaction(async (sql) => {
    const result = await sql<{ order_id: string; session_id: string | null }>(
      `
        select distinct r.order_id, r.stripe_checkout_session_id as session_id
        from inventory_reservations r
        join orders o on o.id = r.order_id
        where r.status = 'active'
          and r.expires_at <= now()
          and o.status = 'pending'
        order by r.order_id
      `,
    );
    return result.rows.map((row) => ({
      orderId: row.order_id,
      sessionId: row.session_id,
    }));
  });
}

export async function loadShopOrderBySession(sessionId: string): Promise<ShopOrderStatusView | null> {
  return transaction(async (sql) => {
    const result = await sql<Record<string, unknown>>(
      `
        select
          o.id,
          o.order_number::text as order_number,
          o.status,
          o.customer_email,
          o.subtotal_cents,
          o.shipping_cents,
          o.total_cents,
          p.status as payment_status
        from orders o
        left join payments p
          on p.order_id = o.id
         and p.status <> 'failed'
        where o.stripe_checkout_session_id = $1
        limit 1
      `,
      [sessionId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const status = String(row.status);
    const paymentStatus = typeof row.payment_status === 'string' ? row.payment_status : null;
    const paid =
      paymentStatus === 'paid' ||
      paymentStatus === 'partially_refunded' ||
      paymentStatus === 'refunded' ||
      status === 'paid' ||
      status === 'partially_fulfilled' ||
      status === 'fulfilled';
    const cancelled = status === 'cancelled';
    return {
      orderId: String(row.id),
      orderNumber: Number(row.order_number),
      status,
      paymentStatus,
      email: maskEmail(String(row.customer_email ?? '')),
      subtotalCents: readCount(row.subtotal_cents),
      shippingCents: readCount(row.shipping_cents),
      totalCents: readCount(row.total_cents),
      paid,
      cancelled,
      confirming: !paid && !cancelled && paymentStatus === 'pending',
    };
  });
}

export async function claimShopWebhookEvent(
  sql: Sql,
  eventId: string,
  eventType: string,
): Promise<'duplicate' | 'continue'> {
  const existing = await sql<{ status: string }>(
    `select status from webhook_events where id = $1 for update`,
    [eventId],
  );
  const status = existing.rows[0]?.status;
  if (status === 'processed') {
    return 'duplicate';
  }
  if (status === 'failed' || status === 'processing') {
    return 'continue';
  }
  try {
    await sql(
      `insert into webhook_events (id, event_type, status) values ($1, $2, 'processing')`,
      [eventId, eventType],
    );
  } catch (error) {
    const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
    if (code !== '23505') {
      throw error;
    }
    const raced = await sql<{ status: string }>(
      `select status from webhook_events where id = $1 for update`,
      [eventId],
    );
    if (raced.rows[0]?.status === 'processed') {
      return 'duplicate';
    }
  }
  return 'continue';
}

export async function markShopWebhookProcessed(sql: Sql, eventId: string, eventType: string): Promise<void> {
  const updated = await sql(
    `
      update webhook_events
      set status = 'processed',
          processed_at = now(),
          error = null
      where id = $1
    `,
    [eventId],
  );
  if (updated.rowCount === 1) {
    return;
  }
  await sql(
    `
      insert into webhook_events (id, event_type, status, processed_at)
      values ($1, $2, 'processed', now())
    `,
    [eventId, eventType],
  );
}

export async function markShopWebhookFailed(eventId: string, eventType: string, message: string): Promise<void> {
  await transaction(async (sql) => {
    const existing = await sql<{ status: string }>(
      `select status from webhook_events where id = $1 for update`,
      [eventId],
    );
    const status = existing.rows[0]?.status;
    if (status === 'processed') {
      return;
    }
    const error = message.slice(0, 300);
    if (status) {
      await sql(`update webhook_events set status = 'failed', error = $2 where id = $1`, [eventId, error]);
      return;
    }
    await sql(
      `insert into webhook_events (id, event_type, status, error) values ($1, $2, 'failed', $3)`,
      [eventId, eventType, error],
    );
  });
}

async function loadAndLockInventory(sql: Sql, items: CartItem[]): Promise<InventoryLockRow[]> {
  const result = await sql<InventoryLockRow>(
    `
      select
        i.id as inventory_id,
        i.on_hand,
        i.reserved,
        requested.product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.price_cents as product_price_cents,
        coalesce(p.requires_shipping, false) as requires_shipping,
        p.status as product_status,
        exists (select 1 from product_variants v where v.product_id = requested.product_id) as has_variants,
        requested.variant_id,
        variant.name as variant_name,
        variant.sku as variant_sku,
        variant.price_cents as variant_price_cents,
        coalesce(variant.active, false) as variant_active,
        requested.quantity as requested_quantity
      from jsonb_to_recordset($1::jsonb) as requested(
        product_id uuid,
        variant_id uuid,
        quantity integer
      )
      left join products p on p.id = requested.product_id
      left join product_variants variant
        on variant.id = requested.variant_id
       and variant.product_id = requested.product_id
      join inventory i
        on i.product_id = requested.product_id
       and i.variant_id is not distinct from requested.variant_id
      order by i.id
      for update of i
    `,
    [
      JSON.stringify(
        items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      ),
    ],
  );
  if (result.rows.length !== items.length) {
    throw new ShopCheckoutError('One of those items is no longer available.');
  }
  return result.rows;
}

function mapLockedLine(row: InventoryLockRow): ShopCheckoutLine {
  if (
    !row.inventory_id ||
    row.product_status !== 'active' ||
    row.on_hand === null ||
    row.reserved === null
  ) {
    throw new ShopCheckoutError('One of those items is no longer available.');
  }
  if (row.has_variants) {
    if (!row.variant_id || !row.variant_active || !row.variant_sku || row.variant_price_cents === null) {
      throw new ShopCheckoutError('One of those items is no longer available.');
    }
  } else if (row.variant_id || !row.product_sku || row.product_price_cents === null) {
    throw new ShopCheckoutError('One of those items is no longer available.');
  }

  const available = readCount(row.on_hand) - readCount(row.reserved);
  const quantity = readCount(row.requested_quantity);
  if (available < quantity) {
    throw new ShopCheckoutError('There is not enough stock for that cart.');
  }

  return {
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name || 'Item',
    variantName: row.has_variants ? row.variant_name || '' : '',
    sku: row.has_variants ? String(row.variant_sku) : String(row.product_sku),
    quantity,
    unitPriceCents: row.has_variants ? readCount(row.variant_price_cents) : readCount(row.product_price_cents),
    requiresShipping: row.requires_shipping === true,
    inventoryId: row.inventory_id,
    onHand: readCount(row.on_hand),
    reserved: readCount(row.reserved),
  };
}

async function lockOrder(
  sql: Sql,
  orderId: string,
): Promise<{
  id: string;
  status: string;
  total_cents: number;
  shipping_cents: number;
  paid: boolean;
} | null> {
  const result = await sql<{
    id: string;
    status: string;
    total_cents: number;
    shipping_cents: number;
  }>(`select id, status, total_cents, shipping_cents from orders where id = $1 for update`, [orderId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    status: row.status,
    total_cents: readCount(row.total_cents),
    shipping_cents: readCount(row.shipping_cents),
    paid: shopOrderIsPaidStatus(row.status),
  };
}

async function lockReservations(sql: Sql, orderId: string): Promise<ReservationRow[]> {
  const result = await sql<ReservationRow>(
    `
      select
        r.id,
        r.inventory_id,
        r.order_item_id,
        r.quantity,
        r.status,
        i.on_hand,
        i.reserved
      from inventory_reservations r
      join inventory i on i.id = r.inventory_id
      where r.order_id = $1
      order by i.id
      for update of i, r
    `,
    [orderId],
  );
  return result.rows.map((row) => ({
    ...row,
    quantity: readCount(row.quantity),
    on_hand: readCount(row.on_hand),
    reserved: readCount(row.reserved),
  }));
}

async function lockOpenPayment(
  sql: Sql,
  orderId: string,
): Promise<{ id: string; status: string } | null> {
  const result = await sql<{ id: string; status: string }>(
    `
      select id, status
      from payments
      where order_id = $1
        and status <> 'failed'
      for update
    `,
    [orderId],
  );
  return result.rows[0] ?? null;
}

async function releaseReservation(
  sql: Sql,
  reservation: ReservationRow,
  closure: 'released' | 'expired',
  orderId: string,
): Promise<void> {
  const released = await sql<{ reserved: number; on_hand: number }>(
    `
      update inventory
      set reserved = reserved - $2
      where id = $1
        and reserved >= $2
      returning on_hand, reserved
    `,
    [reservation.inventory_id, reservation.quantity],
  );
  const stock = released.rows[0];
  if (!stock) {
    throw new ShopCheckoutError('That reservation could not be released.');
  }
  await sql(
    `
      update inventory_reservations
      set status = $2,
          closed_at = now()
      where id = $1
        and status = 'active'
    `,
    [reservation.id, closure],
  );
  await sql(
    `
      insert into inventory_movements (
        inventory_id, reservation_id, order_id, movement_type,
        on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
      ) values ($1, $2, $3, 'release', 0, $4, $5, $6, 'Checkout released')
    `,
    [
      reservation.inventory_id,
      reservation.id,
      orderId,
      -reservation.quantity,
      readCount(stock.on_hand),
      readCount(stock.reserved),
    ],
  );
}

async function renewReservation(sql: Sql, reservation: ReservationRow): Promise<void> {
  const held = await sql<{ on_hand: number; reserved: number }>(
    `
      update inventory
      set reserved = reserved + $2
      where id = $1
        and on_hand - reserved >= $2
      returning on_hand, reserved
    `,
    [reservation.inventory_id, reservation.quantity],
  );
  const stock = held.rows[0];
  if (!stock) {
    throw new ShopCheckoutError('There is not enough stock for that cart.');
  }
  await sql(
    `
      update inventory_reservations
      set status = 'active',
          closed_at = null,
          expires_at = now() + interval '30 minutes'
      where id = $1
    `,
    [reservation.id],
  );
  await sql(
    `
      insert into inventory_movements (
        inventory_id, reservation_id, movement_type,
        on_hand_delta, reserved_delta, on_hand_after, reserved_after, note
      ) values ($1, $2, 'reserve', 0, $3, $4, $5, 'Checkout renewed')
    `,
    [
      reservation.inventory_id,
      reservation.id,
      reservation.quantity,
      readCount(stock.on_hand),
      readCount(stock.reserved),
    ],
  );
}

function readCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ShopCheckoutError('That order could not be read.');
  }
  return parsed;
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) {
    return 'held by the shop';
  }
  return `${email.slice(0, 1)}…${email.slice(at)}`;
}
