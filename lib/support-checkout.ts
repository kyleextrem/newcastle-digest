import type Stripe from 'stripe';
import { SITE_URL } from '@/lib/site';
import {
  MIN_CONTRIBUTION_CENTS,
  parseContributionAmount,
} from '@/lib/support-contribution';

export const SUPPORT_CONTRIBUTION_PURPOSE = 'support_contribution';
export const SUPPORT_INTEGRATION_IDENTIFIER = 'newcastle_digest_support_wqxkplmn';

const PRODUCT_ID_PATTERN = /^prod_[A-Za-z0-9]+$/;
const SESSION_ID_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]{8,}$/;
const CHECKOUT_HOST = 'checkout.stripe.com';

export type SupportSessionSnapshot = {
  mode: string | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  amount_total: number | null;
  metadata: { purpose?: string } | null;
};

export type SupportCheckoutResult = {
  status: number;
  body: { url: string } | { error: string };
};

type CreateSession = (
  params: Stripe.Checkout.SessionCreateParams,
) => Promise<{ url: string | null }>;

export function getSupportProductId(): string | null {
  const productId = process.env.STRIPE_SUPPORT_PRODUCT_ID?.trim() ?? '';
  if (!PRODUCT_ID_PATTERN.test(productId)) return null;
  return productId;
}

export function isStripeHostedCheckoutUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === CHECKOUT_HOST;
  } catch {
    return false;
  }
}

export function isSupportCheckoutSessionId(sessionId: string | undefined): sessionId is string {
  return typeof sessionId === 'string' && sessionId.length <= 255 && SESSION_ID_PATTERN.test(sessionId);
}

export function buildSupportCheckoutParams(
  cents: number,
  productId: string,
  amount: string,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'payment',
    currency: 'aud',
    success_url: `${SITE_URL}/support/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/support?amount=${amount}`,
    integration_identifier: SUPPORT_INTEGRATION_IDENTIFIER,
    metadata: {
      purpose: SUPPORT_CONTRIBUTION_PURPOSE,
    },
    custom_text: {
      submit: {
        message: 'One-time contribution to Newcastle Digest.',
      },
    },
    payment_intent_data: {
      description: 'Support Newcastle Digest',
      metadata: {
        purpose: SUPPORT_CONTRIBUTION_PURPOSE,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aud',
          unit_amount: cents,
          product: productId,
        },
      },
    ],
  };
}

export function isConfirmedSupportSession(session: SupportSessionSnapshot): boolean {
  return (
    session.mode === 'payment' &&
    session.currency === 'aud' &&
    session.status === 'complete' &&
    session.payment_status === 'paid' &&
    typeof session.amount_total === 'number' &&
    Number.isInteger(session.amount_total) &&
    session.amount_total >= MIN_CONTRIBUTION_CENTS &&
    session.metadata?.purpose === SUPPORT_CONTRIBUTION_PURPOSE
  );
}

const UNAVAILABLE = 'Support contributions are unavailable right now.';
const CHECKOUT_FAILED = 'We could not start checkout. Please try again.';

export async function createSupportCheckout(input: {
  amount: unknown;
  productId: string | null;
  configured: boolean;
  createSession: CreateSession;
}): Promise<SupportCheckoutResult> {
  const parsed = parseContributionAmount(input.amount);
  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  if (!input.configured || !input.productId) {
    return { status: 503, body: { error: UNAVAILABLE } };
  }

  try {
    const params = buildSupportCheckoutParams(parsed.cents, input.productId, parsed.amount);
    const session = await input.createSession(params);
    if (!isStripeHostedCheckoutUrl(session.url)) {
      return { status: 502, body: { error: CHECKOUT_FAILED } };
    }
    return { status: 200, body: { url: session.url } };
  } catch {
    return { status: 502, body: { error: CHECKOUT_FAILED } };
  }
}
