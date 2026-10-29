import 'server-only';

import { transaction, type Sql } from '@/lib/db';
import { lineDisplayName } from '@/lib/shop-checkout';
import { logShopDatabaseError } from '@/lib/shop-log';
import {
  buildShopOrderEmail,
  isShopEmailConfigured,
  shopCarrierLabel,
  shopEmailFromAddress,
  shopEmailRecipient,
  shopOrderIsConfirmedPaid,
  shopTrackingLabel,
  type ShopEmailType,
  type ShopOrderEmailContent,
} from '@/lib/shop-email-content';

const RESEND_API = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8_000;
const MAX_SEND_ATTEMPTS = 2;

export type ShopOutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type ShopEmailSendResult = { ok: true; id: string } | { ok: false; error: string };

export type ShopEmailTransport = (email: ShopOutboundEmail) => Promise<ShopEmailSendResult>;

export type ShopEmailDeliveryResult = {
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
};

type LoadedOrder = ShopOrderEmailContent & {
  orderId: string;
  orderStatus: string;
  paymentStatus: string | null;
  recipientEmail: string | null;
  shipmentId: string | null;
  shipmentStatus: string | null;
};

export async function sendShopOrderConfirmation(
  orderId: string,
  createIfMissing: boolean,
): Promise<void> {
  const result = await deliverShopEmail({
    type: 'order_confirmation',
    orderId,
    createIfMissing,
  });
  if (result.status === 'failed') {
    logShopDatabaseError('Shop confirmation email failed', new Error(result.reason ?? 'Email failed'));
  }
}

export async function sendShopDispatchEmail(
  orderId: string,
  shipmentId: string,
  createIfMissing: boolean,
): Promise<void> {
  const result = await deliverShopEmail({
    type: 'dispatch',
    orderId,
    shipmentId,
    createIfMissing,
  });
  if (result.status === 'failed') {
    logShopDatabaseError('Shop dispatch email failed', new Error(result.reason ?? 'Email failed'));
  }
}

export async function deliverShopEmail(input: {
  type: ShopEmailType;
  orderId: string;
  shipmentId?: string;
  createIfMissing: boolean;
  sql?: Sql;
  send?: ShopEmailTransport;
}): Promise<ShopEmailDeliveryResult> {
  try {
    const claimed = input.sql
      ? await claimShopEmail(input.sql, input)
      : await transaction((sql) => claimShopEmail(sql, input));
    if (claimed.status !== 'ready') {
      return { status: 'skipped', reason: claimed.reason };
    }

    let lastError = 'Resend did not confirm acceptance';
    for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt += 1) {
      const sent = await sendShopEmailSafely(input.send ?? sendWithResend, claimed.email);
      if (sent.ok) {
        if (input.sql) {
          await markShopEmailSent(input.sql, claimed.deliveryId, sent.id);
        } else {
          await transaction((sql) => markShopEmailSent(sql, claimed.deliveryId, sent.id));
        }
        return { status: 'sent' };
      }
      lastError = sent.error;
      if (isPermanentEmailError(sent.error)) {
        break;
      }
    }

    if (input.sql) {
      await markShopEmailFailed(input.sql, claimed.deliveryId, lastError);
    } else {
      await transaction((sql) => markShopEmailFailed(sql, claimed.deliveryId, lastError));
    }
    return { status: 'failed', reason: lastError };
  } catch (error) {
    logShopDatabaseError(
      input.type === 'dispatch' ? 'Shop dispatch email failed' : 'Shop confirmation email failed',
      error,
    );
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'Email delivery failed',
    };
  }
}

async function claimShopEmail(
  sql: Sql,
  input: {
    type: ShopEmailType;
    orderId: string;
    shipmentId?: string;
    createIfMissing: boolean;
  },
): Promise<
  | { status: 'ready'; deliveryId: string; email: ShopOutboundEmail }
  | { status: 'skipped'; reason: string }
> {
  const order = await loadShopEmailOrder(sql, input.orderId, input.shipmentId ?? null);
  if (!order) {
    return { status: 'skipped', reason: 'missing_order' };
  }
  if (!shopOrderIsConfirmedPaid(order.orderStatus, order.paymentStatus)) {
    return { status: 'skipped', reason: 'not_paid' };
  }
  if (input.type === 'dispatch') {
    if (!input.shipmentId || order.shipmentId !== input.shipmentId || order.shipmentStatus !== 'dispatched') {
      return { status: 'skipped', reason: 'not_dispatched' };
    }
  }

  const recipient = order.recipientEmail;
  if (!recipient) {
    return { status: 'skipped', reason: 'invalid_recipient' };
  }

  const delivery = await loadOrCreateDelivery(sql, {
    type: input.type,
    orderId: order.orderId,
    shipmentId: input.type === 'dispatch' ? order.shipmentId : null,
    recipient,
    createIfMissing: input.createIfMissing,
  });
  if (!delivery) {
    return { status: 'skipped', reason: 'existing_order' };
  }
  if (delivery.status === 'sent') {
    return { status: 'skipped', reason: 'already_sent' };
  }

  await sql(
    `
      update email_deliveries
      set attempt_count = attempt_count + 1,
          last_attempt_at = now(),
          error = null
      where id = $1
        and status <> 'sent'
    `,
    [delivery.id],
  );

  const message = buildShopOrderEmail(input.type, order);
  return {
    status: 'ready',
    deliveryId: delivery.id,
    email: {
      to: recipient,
      subject: message.subject,
      html: message.html,
      text: message.text,
      idempotencyKey: shopEmailIdempotencyKey(input.type, order.orderId, order.shipmentId),
    },
  };
}

async function loadOrCreateDelivery(
  sql: Sql,
  input: {
    type: ShopEmailType;
    orderId: string;
    shipmentId: string | null;
    recipient: string;
    createIfMissing: boolean;
  },
): Promise<{ id: string; status: string } | null> {
  const existing = await loadDelivery(sql, input.type, input.orderId, input.shipmentId);
  if (existing) {
    return existing;
  }
  if (!input.createIfMissing) {
    return null;
  }

  if (input.type === 'order_confirmation') {
    const inserted = await sql<{ id: string; status: string }>(
      `
        insert into email_deliveries (order_id, email_type, recipient_email, status)
        values ($1, 'order_confirmation', $2, 'pending')
        on conflict (order_id) where email_type = 'order_confirmation'
        do nothing
        returning id, status
      `,
      [input.orderId, input.recipient],
    );
    return inserted.rows[0] ?? loadDelivery(sql, input.type, input.orderId, null);
  }

  if (!input.shipmentId) {
    return null;
  }
  const inserted = await sql<{ id: string; status: string }>(
    `
      insert into email_deliveries (order_id, shipment_id, email_type, recipient_email, status)
      values ($1, $2, 'dispatch', $3, 'pending')
      on conflict (shipment_id) where email_type = 'dispatch'
      do nothing
      returning id, status
    `,
    [input.orderId, input.shipmentId, input.recipient],
  );
  return inserted.rows[0] ?? loadDelivery(sql, input.type, input.orderId, input.shipmentId);
}

async function loadDelivery(
  sql: Sql,
  type: ShopEmailType,
  orderId: string,
  shipmentId: string | null,
): Promise<{ id: string; status: string } | null> {
  if (type === 'order_confirmation') {
    const result = await sql<{ id: string; status: string }>(
      `
        select id, status
        from email_deliveries
        where order_id = $1
          and email_type = 'order_confirmation'
        for update
      `,
      [orderId],
    );
    return result.rows[0] ?? null;
  }

  const result = await sql<{ id: string; status: string }>(
    `
      select id, status
      from email_deliveries
      where shipment_id = $1
        and email_type = 'dispatch'
      for update
    `,
    [shipmentId],
  );
  return result.rows[0] ?? null;
}

async function loadShopEmailOrder(
  sql: Sql,
  orderId: string,
  shipmentId: string | null,
): Promise<LoadedOrder | null> {
  const result = await sql<Record<string, unknown>>(
    `
      select
        o.id,
        o.order_number::text as order_number,
        o.status,
        o.customer_name,
        o.customer_email,
        o.subtotal_cents,
        o.shipping_cents,
        o.total_cents,
        o.ship_name,
        o.ship_line1,
        o.ship_line2,
        o.ship_city,
        o.ship_state,
        o.ship_postcode,
        o.ship_country,
        p.status as payment_status
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

  const items = await sql<{
    product_name: string;
    variant_name: string;
    quantity: number;
    unit_price_cents: number;
  }>(
    `
      select product_name, variant_name, quantity, unit_price_cents
      from order_items
      where order_id = $1
      order by created_at, id
    `,
    [orderId],
  );

  let shipment: { id: string; status: string; carrier: string | null; tracking_number: string | null } | null =
    null;
  if (shipmentId) {
    const shipped = await sql<{
      id: string;
      status: string;
      carrier: string | null;
      tracking_number: string | null;
    }>(
      `
        select id, status, carrier, tracking_number
        from shipments
        where id = $1
          and order_id = $2
        limit 1
      `,
      [shipmentId, orderId],
    );
    shipment = shipped.rows[0] ?? null;
  }

  return {
    orderId: String(row.id),
    orderNumber: readCount(row.order_number),
    orderStatus: String(row.status),
    paymentStatus: typeof row.payment_status === 'string' ? row.payment_status : null,
    recipientEmail: shopEmailRecipient(String(row.customer_email ?? '')),
    customerName: String(row.customer_name ?? ''),
    lines: items.rows.map((item) => ({
      name: lineDisplayName(item.product_name, item.variant_name),
      quantity: readCount(item.quantity),
      unitPriceCents: readCount(item.unit_price_cents),
    })),
    shippingCents: readCount(row.shipping_cents),
    totalCents: readCount(row.total_cents),
    address: {
      name: String(row.ship_name ?? ''),
      line1: String(row.ship_line1 ?? ''),
      line2: String(row.ship_line2 ?? ''),
      city: String(row.ship_city ?? ''),
      state: String(row.ship_state ?? ''),
      postcode: String(row.ship_postcode ?? ''),
      country: String(row.ship_country ?? ''),
    },
    shipmentId: shipment?.id ?? null,
    shipmentStatus: shipment?.status ?? null,
    carrier: shopCarrierLabel(shipment?.carrier),
    trackingNumber: shopTrackingLabel(shipment?.tracking_number) ?? shipment?.tracking_number ?? null,
  };
}

async function markShopEmailSent(sql: Sql, deliveryId: string, providerMessageId: string): Promise<void> {
  await sql(
    `
      update email_deliveries
      set status = 'sent',
          sent_at = now(),
          provider_message_id = $2,
          error = null
      where id = $1
        and status <> 'sent'
    `,
    [deliveryId, providerMessageId.slice(0, 160)],
  );
}

async function markShopEmailFailed(sql: Sql, deliveryId: string, error: string): Promise<void> {
  await sql(
    `
      update email_deliveries
      set status = 'failed',
          error = $2
      where id = $1
        and status <> 'sent'
    `,
    [deliveryId, error.slice(0, 500)],
  );
}

export async function sendWithResend(email: ShopOutboundEmail): Promise<ShopEmailSendResult> {
  if (!isShopEmailConfigured()) {
    return { ok: false, error: 'RESEND_API_KEY is not set' };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': email.idempotencyKey,
      },
      body: JSON.stringify({
        from: shopEmailFromAddress(),
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
      name?: string;
    } | null;
    if (!response.ok || !body?.id) {
      return {
        ok: false,
        error: body?.message || body?.name || `Resend responded with ${response.status}`,
      };
    }
    return { ok: true, id: body.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Resend request failed',
    };
  }
}

async function sendShopEmailSafely(
  send: ShopEmailTransport,
  email: ShopOutboundEmail,
): Promise<ShopEmailSendResult> {
  try {
    return await send(email);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Resend request failed',
    };
  }
}

function shopEmailIdempotencyKey(
  type: ShopEmailType,
  orderId: string,
  shipmentId: string | null,
): string {
  switch (type) {
    case 'order_confirmation':
      return `shop-order-confirmation-${orderId}`;
    case 'dispatch':
      return `shop-dispatch-${shipmentId ?? orderId}`;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function isPermanentEmailError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes('invalid') ||
    lower.includes('not a valid') ||
    lower.includes('missing') ||
    lower.includes('validation')
  );
}

function readCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return 0;
  }
  return parsed;
}
