import type { Metadata } from 'next';
import Link from 'next/link';
import { isShopCheckoutSessionId } from '@/lib/shop-checkout';
import { expireOpenShopSession } from '@/lib/shop-checkout-flow';
import { cancelShopCheckout, loadShopOrderBySession } from '@/lib/shop-checkout-order';
import { logShopDatabaseError } from '@/lib/shop-log';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Checkout cancelled | Newcastle Digest Shop' },
  description: 'Shop checkout cancelled.',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopCheckoutCancelPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;
  if (isShopCheckoutSessionId(sessionId)) {
    try {
      await expireOpenShopSession(sessionId);
      const order = await loadShopOrderBySession(sessionId);
      if (order && !order.paid) {
        await cancelShopCheckout(order.orderId, 'released');
      }
    } catch (error) {
      logShopDatabaseError('Shop checkout cancel failed', error);
    }
  }

  const order = isShopCheckoutSessionId(sessionId) ? await loadShopOrderBySession(sessionId) : null;

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
      <div className="container mx-auto max-w-xl">
        <p className="mb-6 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
          Newcastle Digest shop
        </p>
        <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl">
          Checkout was cancelled.
        </h1>
        <p className="mb-10 font-sans-main text-lg leading-relaxed text-[#251f18]/80">
          {order?.paid
            ? `Order ${order.orderNumber} was already paid, so nothing was cancelled.`
            : 'Nothing was charged. Held stock has been released, and your cart is still saved on this device.'}
        </p>
        <div className="flex flex-col items-start gap-4">
          <Link
            href="/shop"
            className="font-sans-main text-base text-[#849bff] underline underline-offset-2 hover:opacity-70"
          >
            Back to the shop
          </Link>
        </div>
      </div>
    </section>
  );
}
