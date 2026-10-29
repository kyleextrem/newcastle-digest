import Link from 'next/link';
import { listAdminOrders } from '@/lib/shop-admin-orders';
import { fulfilmentStatusLabel, paymentStatusLabel } from '@/lib/shop-admin-orders-policy';
import { requireShopAdmin } from '@/lib/shop-admin-session';
import { formatAudCents } from '@/lib/shop-display';

export const dynamic = 'force-dynamic';

const dates = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeZone: 'Australia/Sydney',
});

export default async function ShopAdminOrdersPage() {
  await requireShopAdmin();
  const orders = await listAdminOrders();

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
          Newcastle Digest
        </p>
        <h1 className="mt-2 font-sans-main text-5xl font-black uppercase tracking-tighter md:text-7xl">
          Orders
        </h1>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <h2 className="font-sans-main text-3xl font-black uppercase tracking-tighter">No orders yet</h2>
            <p className="mt-3 font-sans-main text-[#251f18]/60">Paid checkouts will show up here.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/shop/admin/orders/${order.id}`}
                  className="block rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">
                      Order {order.orderNumber}
                    </h2>
                    <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
                      {formatAudCents(order.totalCents)}
                    </span>
                  </div>
                  <p className="mt-2 font-sans-main text-[#251f18]/70">{order.customerName}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Meta label="Date" value={dates.format(new Date(order.createdAt))} />
                    <Meta label="Payment" value={paymentStatusLabel(order.paymentStatus)} />
                    <Meta label="Fulfilment" value={fulfilmentStatusLabel(order.fulfilmentStatus)} />
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/40">{label}</dt>
      <dd className="mt-1 font-sans-main text-sm font-black">{value}</dd>
    </div>
  );
}

