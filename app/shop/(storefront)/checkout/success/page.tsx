import type { Metadata } from 'next';
import Link from 'next/link';
import { ClearPaidCart } from '@/components/shop/ClearPaidCart';
import { isShopCheckoutSessionId } from '@/lib/shop-checkout';
import { loadShopOrderBySession } from '@/lib/shop-checkout-order';
import { formatAudCents } from '@/lib/shop-display';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Order confirmation | Newcastle Digest Shop' },
  description: 'Shop order confirmation.',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopCheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;
  const order = isShopCheckoutSessionId(sessionId) ? await loadShopOrderBySession(sessionId) : null;

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
      <div className="container mx-auto max-w-xl">
        <ClearPaidCart paid={Boolean(order?.paid)} />
        <p className="mb-6 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
          Newcastle Digest shop
        </p>
        {order?.paid ? (
          <>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl">
              Payment received.
            </h1>
            <p className="mb-6 font-sans-main text-lg leading-relaxed text-[#251f18]/80">
              Order {order.orderNumber} is paid. A confirmation email will be sent to {order.email}.
              This page is also your receipt if that email is still on its way.
            </p>
            <OrderTotals order={order} />
          </>
        ) : order?.cancelled ? (
          <>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl">
              This order was cancelled.
            </h1>
            <p className="mb-10 font-sans-main text-lg leading-relaxed text-[#251f18]/80">
              Nothing has been charged for order {order.orderNumber}, and held stock has been released.
            </p>
          </>
        ) : order ? (
          <>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl">
              We&apos;re confirming your payment.
            </h1>
            <p className="mb-6 font-sans-main text-lg leading-relaxed text-[#251f18]/80">
              Order {order.orderNumber} is still pending. Stock stays held until Stripe confirms the
              payment. A confirmation email will be sent after that. Refresh this page in a moment.
            </p>
            <OrderTotals order={order} />
          </>
        ) : (
          <>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl">
              We have not confirmed this order.
            </h1>
            <p className="mb-10 font-sans-main text-lg leading-relaxed text-[#251f18]/80">
              This page shows a confirmation only after the shop can match a Stripe checkout session
              to an order. If you cancelled, your cart is still on this device.
            </p>
          </>
        )}
        <Link
          href="/shop"
          className="mt-10 inline-flex font-sans-main text-base text-[#849bff] underline underline-offset-2 hover:opacity-70"
        >
          Back to the shop
        </Link>
      </div>
    </section>
  );
}

function OrderTotals({
  order,
}: {
  order: { subtotalCents: number; shippingCents: number; totalCents: number };
}) {
  return (
    <dl className="mb-10 space-y-2 font-sans-main text-base text-[#251f18]/80">
      <div className="flex justify-between gap-4">
        <dt>Items</dt>
        <dd className="font-black">{formatAudCents(order.subtotalCents)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>{order.shippingCents > 0 ? 'Shipping to Australia' : 'Shipping'}</dt>
        <dd className="font-black">{order.shippingCents > 0 ? formatAudCents(order.shippingCents) : 'Free'}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Total</dt>
        <dd className="font-black">{formatAudCents(order.totalCents)}</dd>
      </div>
    </dl>
  );
}
