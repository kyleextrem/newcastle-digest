import { SITE_NAME, SITE_URL } from '@/lib/site';
import { formatAudCents } from '@/lib/shop-display';

export const DEFAULT_SHOP_EMAIL_FROM = 'Newcastle Digest <notifications@newcastledigest.com>';
export const SHOP_EMAIL_LOGO_URL = `${SITE_URL}/nd-logo.png`;
export const SHOP_STORE_URL = `${SITE_URL}/shop`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PENDING_CHECKOUT_DOMAIN = '@checkout.newcastledigest.com';
const PAID_ORDER_STATUSES = new Set([
  'paid',
  'partially_fulfilled',
  'fulfilled',
  'partially_refunded',
  'refunded',
]);
const PAID_PAYMENT_STATUSES = new Set(['paid', 'partially_refunded', 'refunded']);

export type ShopEmailType = 'order_confirmation' | 'dispatch';

export type ShopEmailLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type ShopEmailAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type ShopOrderEmailContent = {
  orderNumber: number;
  customerName: string;
  lines: ShopEmailLine[];
  shippingCents: number;
  totalCents: number;
  address: ShopEmailAddress;
  carrier: string | null;
  trackingNumber: string | null;
};

export function shopOrderIsConfirmedPaid(
  orderStatus: string,
  paymentStatus: string | null,
): boolean {
  if (orderStatus === 'pending' || orderStatus === 'cancelled') {
    return false;
  }
  if (paymentStatus === null || paymentStatus === 'pending' || paymentStatus === 'failed') {
    return false;
  }
  return PAID_ORDER_STATUSES.has(orderStatus) && PAID_PAYMENT_STATUSES.has(paymentStatus);
}

export function shopEmailRecipient(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(value) || value.length > 320) {
    return null;
  }
  if (value.endsWith(PENDING_CHECKOUT_DOMAIN)) {
    return null;
  }
  return value;
}

export function shopEmailFromAddress(env: Record<string, string | undefined> = process.env): string {
  const configured = env.SHOP_EMAIL_FROM?.trim();
  return configured || DEFAULT_SHOP_EMAIL_FROM;
}

export function isShopEmailConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

export function shopTrackingUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function shopTrackingLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.toLowerCase() === 'not recorded') {
    return null;
  }
  return trimmed;
}

export function shopCarrierLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

export function formatShopAddress(address: ShopEmailAddress): string {
  return [
    address.name,
    address.line1,
    address.line2,
    `${address.city} ${address.state} ${address.postcode}`.replace(/\s+/g, ' ').trim(),
    countryLabel(address.country),
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n');
}

export function buildShopOrderEmail(
  type: ShopEmailType,
  content: ShopOrderEmailContent,
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'order_confirmation':
      return {
        subject: `Order ${content.orderNumber} confirmed — ${SITE_NAME}`,
        html: renderEmailHtml({
          kicker: SITE_NAME,
          title: `Order ${content.orderNumber} is confirmed`,
          intro: `Thanks${content.customerName ? `, ${content.customerName}` : ''}. We've received payment for your Newcastle Digest shop order.`,
          content,
          type,
        }),
        text: renderEmailText({
          title: `Order ${content.orderNumber} is confirmed`,
          intro: `Thanks${content.customerName ? `, ${content.customerName}` : ''}. We've received payment for your Newcastle Digest shop order.`,
          content,
          type,
        }),
      };
    case 'dispatch':
      return {
        subject: `Order ${content.orderNumber} has shipped — ${SITE_NAME}`,
        html: renderEmailHtml({
          kicker: SITE_NAME,
          title: `Order ${content.orderNumber} is on its way`,
          intro: `Good news${content.customerName ? `, ${content.customerName}` : ''}. Your Newcastle Digest shop order has been packed and handed to the courier.`,
          content,
          type,
        }),
        text: renderEmailText({
          title: `Order ${content.orderNumber} is on its way`,
          intro: `Good news${content.customerName ? `, ${content.customerName}` : ''}. Your Newcastle Digest shop order has been packed and handed to the courier.`,
          content,
          type,
        }),
      };
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

function renderEmailHtml(input: {
  kicker: string;
  title: string;
  intro: string;
  content: ShopOrderEmailContent;
  type: ShopEmailType;
}): string {
  const { content } = input;
  const trackingUrl = shopTrackingUrl(content.trackingNumber);
  const trackingLabel = shopTrackingLabel(content.trackingNumber);
  const carrier = shopCarrierLabel(content.carrier);
  const itemRows = content.lines
    .map((line) => {
      const lineTotal = formatAudCents(line.quantity * line.unitPriceCents);
      return `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #ece7dc;font-size:16px;line-height:1.45;color:#251f18;">${escapeHtml(line.name)}<br /><span style="font-size:13px;color:#6f675d;">Qty ${line.quantity} · ${escapeHtml(formatAudCents(line.unitPriceCents))} each</span></td>
                  <td align="right" style="padding:10px 0;border-bottom:1px solid #ece7dc;font-size:16px;font-weight:700;color:#251f18;white-space:nowrap;">${escapeHtml(lineTotal)}</td>
                </tr>`;
    })
    .join('');
  const shippingRow =
    content.shippingCents > 0
      ? totalRow('Shipping to Australia', formatAudCents(content.shippingCents))
      : totalRow('Shipping', 'Free');
  const trackingBlock =
    input.type === 'dispatch'
      ? `<tr>
              <td style="padding-top:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;border-radius:16px;padding:18px 20px;">
                  ${carrier ? infoRow('Carrier', carrier) : ''}
                  ${trackingLabel ? infoRow('Tracking', trackingLabel) : ''}
                  ${
                    trackingUrl
                      ? `<tr>
                      <td colspan="2" style="padding-top:14px;">
                        <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#849bff;color:#ffffff;text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;letter-spacing:0.04em;padding:12px 20px;border-radius:999px;">Track this parcel</a>
                      </td>
                    </tr>`
                      : ''
                  }
                  ${!carrier && !trackingLabel ? `<tr><td style="font-size:16px;line-height:1.5;color:#251f18;">We'll update you if more tracking details come through.</td></tr>` : ''}
                </table>
              </td>
            </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#faf9f6;color:#251f18;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;padding:28px 22px;box-shadow:0 8px 40px -12px rgba(0,0,0,0.08);">
            <tr>
              <td>
                <img src="${escapeHtml(SHOP_EMAIL_LOGO_URL)}" width="48" height="48" alt="${escapeHtml(SITE_NAME)}" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#849bff;">${escapeHtml(input.kicker)}</td>
            </tr>
            <tr>
              <td style="padding-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.15;color:#251f18;">${escapeHtml(input.title)}</td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.6;color:#251f18;">${escapeHtml(input.intro)}</td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${shippingRow}
                  ${totalRow('Total paid', formatAudCents(content.totalCents), true)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6f675d;">${content.shippingCents > 0 ? 'Delivering to' : 'Order details'}</td>
            </tr>
            <tr>
              <td style="padding-top:8px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.55;color:#251f18;white-space:pre-line;">${escapeHtml(formatShopAddress(content.address))}</td>
            </tr>
            ${trackingBlock}
            <tr>
              <td style="padding-top:28px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#6f675d;">
                <a href="${escapeHtml(SHOP_STORE_URL)}" style="color:#849bff;text-decoration:underline;">Visit the shop</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderEmailText(input: {
  title: string;
  intro: string;
  content: ShopOrderEmailContent;
  type: ShopEmailType;
}): string {
  const trackingUrl = shopTrackingUrl(input.content.trackingNumber);
  const trackingLabel = shopTrackingLabel(input.content.trackingNumber);
  const carrier = shopCarrierLabel(input.content.carrier);
  const lines = [
    input.title,
    '',
    input.intro,
    '',
    ...input.content.lines.map(
      (line) =>
        `${line.name} × ${line.quantity} — ${formatAudCents(line.quantity * line.unitPriceCents)}`,
    ),
    '',
    input.content.shippingCents > 0
      ? `Shipping to Australia: ${formatAudCents(input.content.shippingCents)}`
      : 'Shipping: Free',
    `Total paid: ${formatAudCents(input.content.totalCents)}`,
    '',
    input.content.shippingCents > 0 ? 'Delivering to:' : 'Order details:',
    formatShopAddress(input.content.address),
  ];
  if (input.type === 'dispatch') {
    lines.push('');
    if (carrier) {
      lines.push(`Carrier: ${carrier}`);
    }
    if (trackingLabel) {
      lines.push(`Tracking: ${trackingLabel}`);
    }
    if (trackingUrl) {
      lines.push(`Track this parcel: ${trackingUrl}`);
    }
  }
  lines.push('', SHOP_STORE_URL);
  return lines.join('\n');
}

function totalRow(label: string, value: string, emphasize = false): string {
  const weight = emphasize ? '800' : '400';
  return `<tr>
                  <td style="padding:8px 0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;color:#251f18;font-weight:${weight};">${escapeHtml(label)}</td>
                  <td align="right" style="padding:8px 0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;color:#251f18;font-weight:${weight};">${escapeHtml(value)}</td>
                </tr>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
                    <td style="padding:0 0 6px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6f675d;">${escapeHtml(label)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 12px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.5;color:#251f18;">${escapeHtml(value)}</td>
                  </tr>`;
}

function countryLabel(country: string): string {
  return country === 'AU' ? 'Australia' : country;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
