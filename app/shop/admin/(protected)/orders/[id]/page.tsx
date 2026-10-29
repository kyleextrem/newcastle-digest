import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderFulfilmentForm } from '@/components/shop-admin/OrderFulfilmentForm';
import { OrderRefundForm } from '@/components/shop-admin/OrderRefundForm';
import { getAdminOrder } from '@/lib/shop-admin-orders';
import { fulfilmentStatusLabel, paymentStatusLabel } from '@/lib/shop-admin-orders-policy';
import { requireShopAdmin } from '@/lib/shop-admin-session';
import { formatAudCents } from '@/lib/shop-display';

export const dynamic = 'force-dynamic';

const dates = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Australia/Sydney',
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShopAdminOrderPage({ params }: PageProps) {
  await requireShopAdmin();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    notFound();
  }

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-3xl space-y-6">
        <Link
          href="/shop/admin/orders"
          className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
        >
          ← Orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-sans-main text-4xl font-black uppercase tracking-tighter md:text-6xl">
            Order {order.orderNumber}
          </h1>
          <Link
            href={`/shop/admin/orders/${order.id}/packing-slip`}
            className="rounded-full border border-[#251f18] px-5 py-2.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em]"
          >
            Packing slip
          </Link>
        </div>

        <section className="rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Customer</h2>
          <p className="mt-3 font-sans-main text-lg font-black">{order.customerName}</p>
          <p className="mt-1 font-sans-main text-[#251f18]/70">{order.customerEmail}</p>
          {order.customerPhone ? (
            <p className="mt-1 font-sans-main text-[#251f18]/70">{order.customerPhone}</p>
          ) : null}
          <p className="mt-4 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/40">
            {dates.format(new Date(order.createdAt))}
          </p>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Items</h2>
          <ul className="mt-4 divide-y divide-[#251f18]/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="font-sans-main font-black">
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ''}
                  </p>
                  <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
                    {item.sku} · qty {item.quantity}
                  </p>
                </div>
                <p className="font-sans-main font-black">
                  {formatAudCents(item.quantity * item.unitPriceCents)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 font-sans-main">
            <Row label="Items" value={formatAudCents(order.subtotalCents)} />
            <Row
              label="Shipping"
              value={order.shippingCents > 0 ? formatAudCents(order.shippingCents) : 'Free'}
            />
            <Row label="Total" value={formatAudCents(order.totalCents)} />
          </dl>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Shipping</h2>
          <address className="mt-3 font-sans-main not-italic leading-relaxed text-[#251f18]/80">
            {order.shipName}
            <br />
            {order.shipLine1}
            {order.shipLine2 ? (
              <>
                <br />
                {order.shipLine2}
              </>
            ) : null}
            <br />
            {order.shipCity} {order.shipState} {order.shipPostcode}
            <br />
            {order.shipCountry}
          </address>
          <p className="mt-4 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
            {fulfilmentStatusLabel(order.fulfilmentStatus)}
          </p>
          {order.shipments.map((shipment) => (
            <p key={shipment.id} className="mt-2 font-sans-main text-sm text-[#251f18]/70">
              {shipment.status === 'dispatched' ? 'Shipped' : 'Packed'}
              {shipment.carrier ? ` · ${shipment.carrier}` : ''}
              {shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ''}
            </p>
          ))}
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Payment</h2>
          <dl className="mt-4 space-y-2 font-sans-main">
            <Row label="Status" value={paymentStatusLabel(order.paymentStatus)} />
            <Row label="Charged" value={formatAudCents(order.paymentAmountCents || order.totalCents)} />
            <Row label="Refunded" value={formatAudCents(order.refundedCents)} />
          </dl>
          {order.refunds.map((refund) => (
            <p key={refund.id} className="mt-3 font-sans-main text-sm text-[#251f18]/70">
              {formatAudCents(refund.amountCents)} · {refund.status}
            </p>
          ))}
        </section>

        <OrderFulfilmentForm orderId={order.id} canPack={order.canPack} canShip={order.canShip} />
        {order.canRefund ? (
          <OrderRefundForm orderId={order.id} remainingCents={order.remainingRefundCents} />
        ) : null}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#251f18]/60">{label}</dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}
