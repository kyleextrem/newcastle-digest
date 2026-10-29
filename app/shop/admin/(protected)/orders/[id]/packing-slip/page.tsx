import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/shop-admin/PrintButton';
import { getAdminOrder } from '@/lib/shop-admin-orders';
import { requireShopAdmin } from '@/lib/shop-admin-session';
import { formatAudCents } from '@/lib/shop-display';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShopAdminPackingSlipPage({ params }: PageProps) {
  await requireShopAdmin();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    notFound();
  }

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={`/shop/admin/orders/${order.id}`}
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
          >
            ← Order
          </Link>
          <PrintButton />
        </div>

        <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
          Newcastle Digest
        </p>
        <h1 className="mt-2 font-sans-main text-4xl font-black uppercase tracking-tighter">
          Packing slip
        </h1>
        <p className="mt-2 font-sans-main text-lg font-black">Order {order.orderNumber}</p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">Ship to</h2>
            <address className="mt-2 font-sans-main not-italic leading-relaxed">
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
          </div>
          <div>
            <h2 className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">Order</h2>
            <p className="mt-2 font-sans-main leading-relaxed">
              {order.customerName}
              <br />
              {order.customerEmail}
            </p>
          </div>
        </div>

        <table className="mt-10 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#251f18]/20 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
              <th className="py-2 font-normal">Item</th>
              <th className="py-2 font-normal">SKU</th>
              <th className="py-2 font-normal">Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-[#251f18]/10 font-sans-main">
                <td className="py-3 font-black">
                  {item.productName}
                  {item.variantName ? ` — ${item.variantName}` : ''}
                </td>
                <td className="py-3">{item.sku}</td>
                <td className="py-3">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-8 font-sans-main text-sm text-[#251f18]/70">
          Shipping {order.shippingCents > 0 ? formatAudCents(order.shippingCents) : 'free'} · Total{' '}
          {formatAudCents(order.totalCents)}
        </p>
      </div>
    </section>
  );
}
