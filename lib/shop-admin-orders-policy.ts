import { AdminInputError, parseAudToCents } from '@/lib/shop-admin-policy';

export const ADMIN_PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'partially_refunded',
  'refunded',
] as const;

export const ADMIN_FULFILMENT_STATUSES = [
  'unfulfilled',
  'packed',
  'partially_shipped',
  'shipped',
] as const;

export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];
export type AdminFulfilmentStatus = (typeof ADMIN_FULFILMENT_STATUSES)[number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseAdminOrderId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new AdminInputError('That order could not be found.');
  }
  return value.toLowerCase();
}

export function remainingRefundCents(paymentAmountCents: number, succeededRefundCents: number): number {
  return Math.max(0, paymentAmountCents - succeededRefundCents);
}

export function paymentStatusAfterRefund(
  paymentAmountCents: number,
  succeededRefundCents: number,
): Extract<AdminPaymentStatus, 'paid' | 'partially_refunded' | 'refunded'> {
  if (succeededRefundCents <= 0) {
    return 'paid';
  }
  if (succeededRefundCents >= paymentAmountCents) {
    return 'refunded';
  }
  return 'partially_refunded';
}

export function orderStatusAfterRefund(
  paymentStatus: ReturnType<typeof paymentStatusAfterRefund>,
): 'partially_refunded' | 'refunded' {
  return paymentStatus === 'refunded' ? 'refunded' : 'partially_refunded';
}

export function orderStatusAfterShipment(
  currentStatus: string,
  allItemsShipped: boolean,
): string {
  switch (currentStatus) {
    case 'cancelled':
    case 'refunded':
    case 'partially_refunded':
      return currentStatus;
    case 'pending':
    case 'paid':
    case 'partially_fulfilled':
    case 'fulfilled':
      return allItemsShipped ? 'fulfilled' : 'partially_fulfilled';
    default:
      return currentStatus;
  }
}

export function adminFulfilmentStatus(input: {
  orderedQuantity: number;
  packedQuantity: number;
  shippedQuantity: number;
}): AdminFulfilmentStatus {
  if (input.shippedQuantity >= input.orderedQuantity && input.orderedQuantity > 0) {
    return 'shipped';
  }
  if (input.shippedQuantity > 0) {
    return 'partially_shipped';
  }
  if (input.packedQuantity > 0) {
    return 'packed';
  }
  return 'unfulfilled';
}

export function fulfilmentStatusLabel(status: AdminFulfilmentStatus): string {
  switch (status) {
    case 'unfulfilled':
      return 'Unfulfilled';
    case 'packed':
      return 'Packed';
    case 'partially_shipped':
      return 'Partially shipped';
    case 'shipped':
      return 'Shipped';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function paymentStatusLabel(status: string | null): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'partially_refunded':
      return 'Partially refunded';
    case 'refunded':
      return 'Refunded';
    case null:
      return 'None';
    default:
      return 'Unknown';
  }
}

export function parseRefundAmountCents(input: unknown, remainingCents: number): number {
  if (remainingCents <= 0) {
    throw new AdminInputError('This order has already been refunded.');
  }
  if (input === 'remaining' || input === undefined || input === null || input === '') {
    return remainingCents;
  }
  if (typeof input !== 'string' && typeof input !== 'number') {
    throw new AdminInputError('Enter a refund amount in Australian dollars.');
  }
  const cents = typeof input === 'number' ? input : parseAudToCents(input);
  if (cents === null || cents <= 0) {
    throw new AdminInputError('Enter a refund amount in Australian dollars, such as 5 or 5.00.');
  }
  if (cents > remainingCents) {
    throw new AdminInputError('That refund is more than the amount still paid.');
  }
  return cents;
}

export function parseShipmentDetails(input: {
  carrier?: unknown;
  trackingNumber?: unknown;
}): { carrier: string; trackingNumber: string } {
  return {
    carrier: clipOptional(input.carrier, 'Carrier', 80) || 'Manual',
    trackingNumber: clipOptional(input.trackingNumber, 'Tracking number', 80) || 'Not recorded',
  };
}

export function refundIdempotencyKey(paymentId: string, alreadyRefundedCents: number, amountCents: number): string {
  return `shop-refund-${paymentId}-${alreadyRefundedCents}-${amountCents}`;
}

function clipOptional(value: unknown, label: string, max: number): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value !== 'string') {
    throw new AdminInputError(`${label} could not be read.`);
  }
  const clipped = value.trim().slice(0, max);
  if (value.trim().length > max) {
    throw new AdminInputError(`${label} is too long.`);
  }
  return clipped;
}
