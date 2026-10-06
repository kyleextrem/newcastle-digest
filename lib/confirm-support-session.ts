import { getStripe } from '@/lib/stripe';
import {
  isConfirmedSupportSession,
  isSupportCheckoutSessionId,
} from '@/lib/support-checkout';

export async function confirmSupportCheckout(sessionId: string | undefined): Promise<boolean> {
  if (!isSupportCheckoutSessionId(sessionId) || !process.env.STRIPE_SECRET_KEY) {
    return false;
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return isConfirmedSupportSession({
      mode: session.mode,
      currency: session.currency,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      metadata: session.metadata,
    });
  } catch {
    return false;
  }
}
