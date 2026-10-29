import 'server-only';

import { transaction, type Sql } from '@/lib/db';
import { AdminInputError } from '@/lib/shop-admin-policy';
import {
  adminFulfilmentStatus,
  orderStatusAfterRefund,
  orderStatusAfterShipment,
  parseAdminOrderId,
  parseRefundAmountCents,
  parseShipmentDetails,
  paymentStatusAfterRefund,
  refundIdempotencyKey,
  remainingRefundCents,
  type AdminFulfilmentStatus,
} from '@/lib/shop-admin-orders-policy';
import { sendShopDispatchEmail } from '@/lib/shop-email';
import { logShopDatabaseError } from '@/lib/shop-log';
import { getStripe } from '@/lib/stripe';

export type AdminOrderListItem = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  totalCents: number;
  paymentStatus: string | null;
  fulfilmentStatus: AdminFulfilmentStatus;
};

export type AdminOrderItemView = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  packedQuantity: number;
  shippedQuantity: number;
};

export type AdminOrderShipmentView = {
  id: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  dispatchedAt: string | null;
};

export type AdminOrderRefundView = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  createdAt: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paymentStatus: string | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  paymentAmountCents: number;
  refundedCents: number;
  remainingRefundCents: number;
  fulfilmentStatus: AdminFulfilmentStatus;
  canPack: boolean;
  canShip: boolean;
  canRefund: boolean;
  shipName: string;
  shipLine1: string;
  shipLine2: string;
  shipCity: string;
  shipState: string;
  shipPostcode: string;
  shipCountry: string;
  items: AdminOrderItemView[];
  shipments: AdminOrderShipmentView[];
  refunds: AdminOrderRefundView[];
};

export type ShopRefundGateway = (input: {
  paymentIntentId: string;
  amountCents: number;
  idempotencyKey: string;
}) => Promise<{ id: string; status: string; amount: number }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listAdminOrders(): Promise<AdminOrderListItem[]> {
  return transaction(async (sql) => {
    const result = await sql<Record<string, unknown>>(
      `
        select
          o.id,
          o.order_number::text as order_number,
          o.customer_name,
          o.customer_email,
          o.created_at,
          o.total_cents,
          p.status as payment_status,
          coalesce((
            select sum(oi.quantity)::int from order_items oi where oi.order_id = o.id
          ), 0) as ordered_quantity,
          coalesce((
            select sum(si.quantity)::int
            from shipment_items si
            join shipments s on s.id = si.shipment_id
            where s.order_id = o.id and s.status = 'pending'
          ), 0) as packed_quantity,
          coalesce((
            select sum(si.quantity)::int
            from shipment_items si
            join shipments s on s.id = si.shipment_id
            where s.order_id = o.id and s.status = 'dispatched'
          ), 0) as shipped_quantity
        from orders o
        left join payments p
          on p.order_id = o.id
         and p.status <> 'failed'
        order by o.created_at desc, o.order_number desc
      `,
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      orderNumber: readCount(row.order_number),
      customerName: String(row.customer_name),
      customerEmail: String(row.customer_email),
      createdAt: toIso(row.created_at),
      totalCents: readCount(row.total_cents),
      paymentStatus: typeof row.payment_status === 'string' ? row.payment_status : null,
      fulfilmentStatus: adminFulfilmentStatus({
        orderedQuantity: readCount(row.ordered_quantity),
        packedQuantity: readCount(row.packed_quantity),
        shippedQuantity: readCount(row.shipped_quantity),
      }),
    }));
  });
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }
  return transaction((sql) => loadOrder(sql, id.toLowerCase()));
}

export async function packAdminOrder(id: unknown): Promise<string> {
  return transaction((sql) => packAdminOrderWithSql(sql, parseAdminOrderId(id)));
}

export async function shipAdminOrder(input: {
  id: unknown;
  carrier?: unknown;
  trackingNumber?: unknown;
}): Promise<string> {
  const details = parseShipmentDetails(input);
  const shipped = await transaction((sql) =>
    shipAdminOrderWithSql(sql, parseAdminOrderId(input.id), details),
  );
  await sendShopDispatchEmail(shipped.orderId, shipped.shipmentId, true);
  return shipped.orderId;
}

export async function refundAdminOrder(
  input: { id: unknown; amount?: unknown },
  createRefund: ShopRefundGateway = createStripeRefund,
): Promise<string> {
  return transaction((sql) =>
    refundAdminOrderWithSql(sql, parseAdminOrderId(input.id), input.amount, createRefund),
  );
}

export async function packAdminOrderWithSql(sql: Sql, orderId: string): Promise<string> {
  const order = await lockPaidOrder(sql, orderId);
  const items = await loadItems(sql, orderId);
  const remaining = items.filter((item) => item.allocatedQuantity < item.quantity);
  if (remaining.length === 0) {
    throw new AdminInputError('This order is already packed or shipped.');
  }
  const shipment = await sql<{ id: string }>(
    `insert into shipments (order_id, status) values ($1, 'pending') returning id`,
    [orderId],
  );
  const shipmentId = shipment.rows[0]?.id;
  if (!shipmentId) {
    throw new AdminInputError('The packing slip could not be created.');
  }
  for (const item of remaining) {
    await sql(
      `
        insert into shipment_items (shipment_id, order_item_id, quantity)
        values ($1, $2, $3)
      `,
      [shipmentId, item.id, item.quantity - item.allocatedQuantity],
    );
  }
  return order.id;
}

export async function shipAdminOrderWithSql(
  sql: Sql,
  orderId: string,
  details: { carrier: string; trackingNumber: string },
): Promise<{ orderId: string; shipmentId: string }> {
  const order = await lockPaidOrder(sql, orderId);
  let pending = await loadPendingShipment(sql, orderId);
  if (!pending) {
    await packAdminOrderWithSql(sql, orderId);
    pending = await loadPendingShipment(sql, orderId);
  }
  if (!pending) {
    throw new AdminInputError('This order is already shipped.');
  }

  const updated = await sql(
    `
      update shipments
      set status = 'dispatched',
          carrier = $2,
          tracking_number = $3,
          postage_cents = $4,
          dispatched_at = now(),
          purchased_at = coalesce(purchased_at, now())
      where id = $1
        and status = 'pending'
    `,
    [pending.id, details.carrier, details.trackingNumber, order.shippingCents],
  );
  if (updated.rowCount !== 1) {
    throw new AdminInputError('This order could not be marked shipped.');
  }

  const items = await loadItems(sql, orderId);
  const allShipped = items.every((item) => item.shippedQuantity + item.pendingQuantity >= item.quantity);
  const nextStatus = orderStatusAfterShipment(order.status, allShipped);
  if (nextStatus !== order.status) {
    await sql(`update orders set status = $2 where id = $1`, [orderId, nextStatus]);
  }
  return { orderId, shipmentId: pending.id };
}

export async function refundAdminOrderWithSql(
  sql: Sql,
  orderId: string,
  amountInput: unknown,
  createRefund: ShopRefundGateway,
): Promise<string> {
  const order = await lockPaidOrder(sql, orderId);
  const payment = await lockOpenPayment(sql, orderId);
  if (!payment || !payment.paymentIntentId) {
    throw new AdminInputError('This order does not have a payment that can be refunded.');
  }
  if (payment.status !== 'paid' && payment.status !== 'partially_refunded') {
    throw new AdminInputError('This order cannot be refunded.');
  }

  const refunded = await succeededRefundTotal(sql, payment.id);
  const remaining = remainingRefundCents(payment.amountCents, refunded);
  const amountCents = parseRefundAmountCents(amountInput, remaining);
  const refund = await createRefund({
    paymentIntentId: payment.paymentIntentId,
    amountCents,
    idempotencyKey: refundIdempotencyKey(payment.id, refunded, amountCents),
  });
  if (!refund.id || refund.amount !== amountCents) {
    throw new AdminInputError('Stripe did not refund the requested amount.');
  }

  const refundStatus = mapRefundStatus(refund.status);
  try {
    await sql(
      `
        insert into refunds (
          payment_id, order_id, stripe_refund_id, amount_cents, currency, status, reason
        ) values ($1, $2, $3, $4, 'aud', $5, 'requested_by_customer')
      `,
      [payment.id, orderId, refund.id, amountCents, refundStatus],
    );
  } catch (error) {
    const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
    if (code !== '23505') {
      throw error;
    }
  }

  const succeeded = await succeededRefundTotal(sql, payment.id);
  if (succeeded > 0) {
    const paymentStatus = paymentStatusAfterRefund(payment.amountCents, succeeded);
    if (paymentStatus !== payment.status) {
      await sql(`update payments set status = $2 where id = $1`, [payment.id, paymentStatus]);
    }
    const nextOrderStatus = orderStatusAfterRefund(paymentStatus);
    if (nextOrderStatus !== order.status) {
      await sql(`update orders set status = $2 where id = $1`, [orderId, nextOrderStatus]);
    }
  }

  return order.id;
}

async function createStripeRefund(input: {
  paymentIntentId: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<{ id: string; status: string; amount: number }> {
  try {
    const refund = await getStripe().refunds.create(
      {
        payment_intent: input.paymentIntentId,
        amount: input.amountCents,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: input.idempotencyKey },
    );
    return {
      id: refund.id,
      status: refund.status ?? 'pending',
      amount: refund.amount,
    };
  } catch (error) {
    logShopDatabaseError('Shop admin Stripe refund failed', error);
    throw new AdminInputError('Stripe could not refund that payment.');
  }
}

async function loadOrder(sql: Sql, orderId: string): Promise<AdminOrderDetail | null> {
  const result = await sql<Record<string, unknown>>(
    `
      select
        o.id,
        o.order_number::text as order_number,
        o.status,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.created_at,
        o.subtotal_cents,
        o.shipping_cents,
        o.total_cents,
        o.stripe_checkout_session_id,
        o.ship_name,
        o.ship_line1,
        o.ship_line2,
        o.ship_city,
        o.ship_state,
        o.ship_postcode,
        o.ship_country,
        p.status as payment_status,
        p.stripe_payment_intent_id,
        p.amount_cents as payment_amount_cents
      from orders o
      left join payments p
        on p.order_id = o.id
       and p.status <> 'failed'
      where o.id = $1
      limit 1
    `,
    [orderId],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const items = await loadItems(sql, orderId);
  const shipments = await sql<{
    id: string;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
    dispatched_at: Date | string | null;
  }>(
    `
      select id, status, carrier, tracking_number, dispatched_at
      from shipments
      where order_id = $1
      order by created_at asc
    `,
    [orderId],
  );
  const refunds = await sql<{
    id: string;
    amount_cents: number;
    status: string;
    created_at: Date | string;
  }>(
    `
      select id, amount_cents, status, created_at
      from refunds
      where order_id = $1
      order by created_at asc
    `,
    [orderId],
  );

  const orderedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const packedQuantity = items.reduce((sum, item) => sum + item.pendingQuantity, 0);
  const shippedQuantity = items.reduce((sum, item) => sum + item.shippedQuantity, 0);
  const paymentAmountCents = row.payment_amount_cents == null ? 0 : readCount(row.payment_amount_cents);
  const refundedCents = refunds.rows
    .filter((refund) => refund.status === 'succeeded')
    .reduce((sum, refund) => sum + readCount(refund.amount_cents), 0);
  const paymentStatus = typeof row.payment_status === 'string' ? row.payment_status : null;
  const remaining = remainingRefundCents(paymentAmountCents, refundedCents);
  const fulfilmentStatus = adminFulfilmentStatus({
    orderedQuantity,
    packedQuantity,
    shippedQuantity,
  });
  const paidLike = paymentStatus === 'paid' || paymentStatus === 'partially_refunded';

  return {
    id: String(row.id),
    orderNumber: readCount(row.order_number),
    status: String(row.status),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: typeof row.customer_phone === 'string' ? row.customer_phone : null,
    createdAt: toIso(row.created_at),
    subtotalCents: readCount(row.subtotal_cents),
    shippingCents: readCount(row.shipping_cents),
    totalCents: readCount(row.total_cents),
    paymentStatus,
    paymentIntentId: typeof row.stripe_payment_intent_id === 'string' ? row.stripe_payment_intent_id : null,
    checkoutSessionId:
      typeof row.stripe_checkout_session_id === 'string' ? row.stripe_checkout_session_id : null,
    paymentAmountCents,
    refundedCents,
    remainingRefundCents: remaining,
    fulfilmentStatus,
    canPack: paidLike && items.some((item) => item.allocatedQuantity < item.quantity),
    canShip: paidLike && (packedQuantity > 0 || items.some((item) => item.allocatedQuantity < item.quantity)),
    canRefund: paidLike && remaining > 0 && typeof row.stripe_payment_intent_id === 'string',
    shipName: String(row.ship_name),
    shipLine1: String(row.ship_line1),
    shipLine2: String(row.ship_line2 ?? ''),
    shipCity: String(row.ship_city),
    shipState: String(row.ship_state),
    shipPostcode: String(row.ship_postcode),
    shipCountry: String(row.ship_country),
    items: items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      packedQuantity: item.pendingQuantity,
      shippedQuantity: item.shippedQuantity,
    })),
    shipments: shipments.rows.map((shipment) => ({
      id: shipment.id,
      status: shipment.status,
      carrier: shipment.carrier,
      trackingNumber: shipment.tracking_number,
      dispatchedAt: shipment.dispatched_at ? toIso(shipment.dispatched_at) : null,
    })),
    refunds: refunds.rows.map((refund) => ({
      id: refund.id,
      amountCents: readCount(refund.amount_cents),
      status: refund.status,
      createdAt: toIso(refund.created_at),
    })),
  };
}

type LineRow = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  pendingQuantity: number;
  shippedQuantity: number;
  allocatedQuantity: number;
};

async function loadItems(sql: Sql, orderId: string): Promise<LineRow[]> {
  const result = await sql<{
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price_cents: number;
    pending_quantity: string | number;
    shipped_quantity: string | number;
  }>(
    `
      select
        oi.id,
        oi.product_name,
        oi.variant_name,
        oi.sku,
        oi.quantity,
        oi.unit_price_cents,
        coalesce((
          select sum(si.quantity) from shipment_items si
          join shipments s on s.id = si.shipment_id
          where si.order_item_id = oi.id and s.status = 'pending'
        ), 0) as pending_quantity,
        coalesce((
          select sum(si.quantity) from shipment_items si
          join shipments s on s.id = si.shipment_id
          where si.order_item_id = oi.id and s.status = 'dispatched'
        ), 0) as shipped_quantity
      from order_items oi
      where oi.order_id = $1
      order by oi.created_at, oi.id
    `,
    [orderId],
  );
  return result.rows.map((row) => {
    const pendingQuantity = readCount(row.pending_quantity);
    const shippedQuantity = readCount(row.shipped_quantity);
    return {
      id: row.id,
      productName: row.product_name,
      variantName: row.variant_name,
      sku: row.sku,
      quantity: readCount(row.quantity),
      unitPriceCents: readCount(row.unit_price_cents),
      pendingQuantity,
      shippedQuantity,
      allocatedQuantity: pendingQuantity + shippedQuantity,
    };
  });
}

async function lockPaidOrder(
  sql: Sql,
  orderId: string,
): Promise<{ id: string; status: string; shippingCents: number }> {
  const result = await sql<{ id: string; status: string; shipping_cents: number }>(
    `select id, status, shipping_cents from orders where id = $1 for update`,
    [orderId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new AdminInputError('That order could not be found.');
  }
  if (row.status === 'pending' || row.status === 'cancelled') {
    throw new AdminInputError('That order is not paid.');
  }
  return { id: row.id, status: row.status, shippingCents: readCount(row.shipping_cents) };
}

async function lockOpenPayment(
  sql: Sql,
  orderId: string,
): Promise<{ id: string; status: string; amountCents: number; paymentIntentId: string | null } | null> {
  const result = await sql<{
    id: string;
    status: string;
    amount_cents: number;
    stripe_payment_intent_id: string | null;
  }>(
    `
      select id, status, amount_cents, stripe_payment_intent_id
      from payments
      where order_id = $1
        and status <> 'failed'
      for update
    `,
    [orderId],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    status: row.status,
    amountCents: readCount(row.amount_cents),
    paymentIntentId: row.stripe_payment_intent_id,
  };
}

async function loadPendingShipment(sql: Sql, orderId: string): Promise<{ id: string } | null> {
  const result = await sql<{ id: string }>(
    `
      select id
      from shipments
      where order_id = $1
        and status = 'pending'
      order by created_at asc
      limit 1
    `,
    [orderId],
  );
  return result.rows[0] ?? null;
}

async function succeededRefundTotal(sql: Sql, paymentId: string): Promise<number> {
  const result = await sql<{ total: string | number }>(
    `
      select coalesce(sum(amount_cents), 0) as total
      from refunds
      where payment_id = $1
        and status = 'succeeded'
    `,
    [paymentId],
  );
  return readCount(result.rows[0]?.total);
}

function mapRefundStatus(status: string): 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'canceled' {
  switch (status) {
    case 'pending':
    case 'requires_action':
    case 'succeeded':
    case 'failed':
    case 'canceled':
      return status;
    default:
      return 'pending';
  }
}

function readCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new AdminInputError('That order could not be read.');
  }
  return parsed;
}

function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value) {
    return new Date(value).toISOString();
  }
  throw new AdminInputError('That order could not be read.');
}
