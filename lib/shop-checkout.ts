import type Stripe from 'stripe';
import { parseCart, type CartItem } from '@/lib/shop-display';

export const SHOP_ORDER_PURPOSE = 'shop_order';
export const SHOP_INTEGRATION_IDENTIFIER = 'newcastle_digest_shop_vhnrqxkm';
export const SHOP_CHECKOUT_CURRENCY = 'aud';
export const SHOP_FLAT_SHIPPING_CENTS = 500;
export const SHOP_RESERVATION_TTL_SECONDS = 32 * 60;
export const SHOP_SHIP_COUNTRY = 'AU';

export const PENDING_CUSTOMER_NAME = 'Checkout pending';
export const PENDING_SHIP_LINE1 = 'Address pending';
export const DIGITAL_SHIP_LINE1 = 'Digital delivery';
export const PENDING_SHIP_CITY = 'Newcastle';
export const PENDING_SHIP_STATE = 'NSW';
export const PENDING_SHIP_POSTCODE = '2300';

const SESSION_ID_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]{8,}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ShopCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopCheckoutError';
  }
}

export type ShopCheckoutLine = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  requiresShipping: boolean;
  inventoryId: string;
  onHand: number;
  reserved: number;
};

export type ShopCustomerSnapshot = {
  name: string;
  email: string;
  phone: string | null;
  shipName: string;
  shipLine1: string;
  shipLine2: string;
  shipCity: string;
  shipState: string;
  shipPostcode: string;
  shipCountry: string;
};

export type ShopSessionSnapshot = {
  id: string;
  livemode: boolean;
  mode: string | null;
  currency: string | null;
  status: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  paymentIntentId: string | null;
  orderId: string | null;
  purpose: string | null;
  shippingAmount: number | null;
  customer: ShopCustomerSnapshot | null;
};

export type ShopStripeEventAction = 'fulfill' | 'cancel' | 'ignore';

export type ShopStripeKeyMode = 'test' | 'live' | 'unknown';

export function shopStripeKeyMode(secretKey: string | undefined): ShopStripeKeyMode {
  const key = secretKey?.trim() ?? '';
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) {
    return 'test';
  }
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    return 'live';
  }
  return 'unknown';
}

export function shopPaymentsAreTestMode(secretKey: string | undefined): boolean {
  return shopStripeKeyMode(secretKey) === 'test';
}

export function shopSessionMatchesConfiguredMode(
  livemode: boolean,
  secretKey: string | undefined,
): boolean {
  const mode = shopStripeKeyMode(secretKey);
  switch (mode) {
    case 'live':
      return livemode === true;
    case 'test':
      return livemode === false;
    case 'unknown':
      return false;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

export function isShopCheckoutConfigured(env: Record<string, string | undefined>): boolean {
  return (
    shopStripeKeyMode(env.STRIPE_SECRET_KEY) !== 'unknown' &&
    Boolean(env.STRIPE_WEBHOOK_SECRET?.trim())
  );
}

export function isShopCheckoutSessionId(value: string | undefined): value is string {
  return typeof value === 'string' && value.length <= 255 && SESSION_ID_PATTERN.test(value);
}

export function isStripeHostedCheckoutUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com';
  } catch {
    return false;
  }
}

export function parseCheckoutCart(input: unknown): CartItem[] {
  const items = parseCart(
    input && typeof input === 'object' && !Array.isArray(input)
      ? input
      : { version: 1, items: input },
  );
  if (items.length === 0) {
    throw new ShopCheckoutError('Your cart is empty.');
  }
  return items;
}

export function shippingCentsForLines(lines: { requiresShipping: boolean }[]): number {
  return lines.some((line) => line.requiresShipping) ? SHOP_FLAT_SHIPPING_CENTS : 0;
}

export function orderTotals(lines: { quantity: number; unitPriceCents: number; requiresShipping: boolean }[]): {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
} {
  const subtotalCents = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new ShopCheckoutError('That cart could not be priced.');
  }
  const shippingCents = shippingCentsForLines(lines);
  return {
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

export function pendingCustomerEmail(orderId: string): string {
  return `pending.${orderId.replace(/-/g, '')}@checkout.newcastledigest.com`;
}

export function pendingCustomer(orderId: string, requiresShipping: boolean): ShopCustomerSnapshot {
  return {
    name: PENDING_CUSTOMER_NAME,
    email: pendingCustomerEmail(orderId),
    phone: null,
    shipName: PENDING_CUSTOMER_NAME,
    shipLine1: requiresShipping ? PENDING_SHIP_LINE1 : DIGITAL_SHIP_LINE1,
    shipLine2: '',
    shipCity: PENDING_SHIP_CITY,
    shipState: PENDING_SHIP_STATE,
    shipPostcode: PENDING_SHIP_POSTCODE,
    shipCountry: SHOP_SHIP_COUNTRY,
  };
}

export function lineDisplayName(productName: string, variantName: string): string {
  return variantName ? `${productName} — ${variantName}` : productName;
}

export function buildShopCheckoutParams(input: {
  origin: string;
  orderId: string;
  lines: ShopCheckoutLine[];
  expiresAtUnix: number;
}): Stripe.Checkout.SessionCreateParams {
  const totals = orderTotals(input.lines);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    currency: SHOP_CHECKOUT_CURRENCY,
    client_reference_id: input.orderId,
    success_url: `${input.origin}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/shop/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
    expires_at: input.expiresAtUnix,
    integration_identifier: SHOP_INTEGRATION_IDENTIFIER,
    metadata: {
      purpose: SHOP_ORDER_PURPOSE,
      order_id: input.orderId,
    },
    payment_intent_data: {
      description: 'Newcastle Digest shop',
      metadata: {
        purpose: SHOP_ORDER_PURPOSE,
        order_id: input.orderId,
      },
    },
    line_items: input.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: SHOP_CHECKOUT_CURRENCY,
        unit_amount: line.unitPriceCents,
        product_data: {
          name: lineDisplayName(line.productName, line.variantName),
        },
      },
    })),
  };

  if (totals.shippingCents > 0) {
    params.shipping_address_collection = {
      allowed_countries: [SHOP_SHIP_COUNTRY],
    };
    params.shipping_options = [
      {
        shipping_rate_data: {
          display_name: 'Australia Post',
          type: 'fixed_amount',
          fixed_amount: {
            amount: totals.shippingCents,
            currency: SHOP_CHECKOUT_CURRENCY,
          },
        },
      },
    ];
  }

  return params;
}

export function shopStripeEventAction(
  eventType: string,
  paymentStatus: string | null,
): ShopStripeEventAction {
  switch (eventType) {
    case 'checkout.session.completed':
      return paymentStatus === 'paid' || paymentStatus === 'no_payment_required' ? 'fulfill' : 'ignore';
    case 'checkout.session.async_payment_succeeded':
    case 'payment_intent.succeeded':
      return 'fulfill';
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      return 'cancel';
    default:
      return 'ignore';
  }
}

export function snapshotCheckoutSession(session: Stripe.Checkout.Session): ShopSessionSnapshot {
  const metadata = session.metadata ?? {};
  return {
    id: session.id,
    livemode: session.livemode === true,
    mode: session.mode ?? null,
    currency: session.currency ?? null,
    status: session.status ?? null,
    paymentStatus: session.payment_status ?? null,
    amountTotal: session.amount_total ?? null,
    paymentIntentId: paymentIntentId(session.payment_intent),
    orderId: uuidOrNull(metadata.order_id) ?? uuidOrNull(session.client_reference_id),
    purpose: metadata.purpose ?? null,
    shippingAmount: session.shipping_cost?.amount_total ?? 0,
    customer: customerFromSession(session),
  };
}

export function assertFulfillableShopSession(session: ShopSessionSnapshot, expectedTotalCents: number): void {
  if (session.purpose !== SHOP_ORDER_PURPOSE) {
    throw new ShopCheckoutError('That checkout does not belong to the shop.');
  }
  if (!session.orderId) {
    throw new ShopCheckoutError('That checkout is missing its order.');
  }
  if (session.mode !== 'payment' || session.currency !== SHOP_CHECKOUT_CURRENCY) {
    throw new ShopCheckoutError('That payment could not be matched to the shop.');
  }
  if (session.paymentStatus !== 'paid' && session.paymentStatus !== 'no_payment_required') {
    throw new ShopCheckoutError('That payment is not complete.');
  }
  if (session.amountTotal !== expectedTotalCents) {
    throw new ShopCheckoutError('That payment does not match the order total.');
  }
}

export function normalizeCustomer(
  snapshot: ShopCustomerSnapshot | null,
  requiresShipping: boolean,
  fallbackOrderId: string,
): ShopCustomerSnapshot {
  const pending = pendingCustomer(fallbackOrderId, requiresShipping);
  if (!snapshot) {
    return pending;
  }
  const email = snapshot.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    throw new ShopCheckoutError('That order is missing a valid email address.');
  }
  const country = snapshot.shipCountry.trim().toUpperCase();
  if (requiresShipping && country !== SHOP_SHIP_COUNTRY) {
    throw new ShopCheckoutError('Shop orders can only be delivered in Australia.');
  }
  return {
    name: clipText(snapshot.name, 160) || pending.name,
    email,
    phone: snapshot.phone ? clipText(snapshot.phone, 40) : null,
    shipName: clipText(snapshot.shipName, 160) || clipText(snapshot.name, 160) || pending.shipName,
    shipLine1: clipText(snapshot.shipLine1, 160) || (requiresShipping ? PENDING_SHIP_LINE1 : DIGITAL_SHIP_LINE1),
    shipLine2: clipText(snapshot.shipLine2, 160),
    shipCity: clipText(snapshot.shipCity, 80) || pending.shipCity,
    shipState: clipText(snapshot.shipState, 80) || pending.shipState,
    shipPostcode: clipText(snapshot.shipPostcode, 16) || pending.shipPostcode,
    shipCountry: requiresShipping ? SHOP_SHIP_COUNTRY : country || SHOP_SHIP_COUNTRY,
  };
}

export function shopOrderIsPaidStatus(status: string): boolean {
  switch (status) {
    case 'paid':
    case 'partially_fulfilled':
    case 'fulfilled':
    case 'partially_refunded':
    case 'refunded':
      return true;
    case 'pending':
    case 'cancelled':
      return false;
    default:
      return false;
  }
}

export function checkoutOriginFromRequest(request: Request, siteUrl: string): string {
  const configured = process.env.SHOP_CHECKOUT_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  if (
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:')
  ) {
    return `http://${host}`;
  }
  if (process.env.VERCEL_ENV === 'production' || !process.env.VERCEL_URL) {
    return siteUrl.replace(/\/$/, '');
  }
  return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
}

function customerFromSession(session: Stripe.Checkout.Session): ShopCustomerSnapshot | null {
  const email = session.customer_details?.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;
  return {
    name: session.customer_details?.name?.trim() || PENDING_CUSTOMER_NAME,
    email,
    phone: session.customer_details?.phone?.trim() || null,
    shipName: shipping?.name?.trim() || session.customer_details?.name?.trim() || PENDING_CUSTOMER_NAME,
    shipLine1: address?.line1?.trim() || '',
    shipLine2: address?.line2?.trim() || '',
    shipCity: address?.city?.trim() || '',
    shipState: address?.state?.trim() || '',
    shipPostcode: address?.postal_code?.trim() || '',
    shipCountry: address?.country?.trim().toUpperCase() || '',
  };
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.id;
}

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || !UUID_PATTERN.test(value)) {
    return null;
  }
  return value.toLowerCase();
}

function clipText(value: string, max: number): string {
  return value.trim().slice(0, max);
}
