import Link from 'next/link';
import { ProductEditor } from '@/components/shop-admin/ProductEditor';
import { requireShopAdmin } from '@/lib/shop-admin-session';

export const dynamic = 'force-dynamic';

export default async function NewShopProductPage() {
  await requireShopAdmin();

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <Link
          href="/shop/admin"
          className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
        >
          ← Products
        </Link>
        <h1 className="mt-4 font-sans-main text-4xl font-black uppercase tracking-tighter md:text-6xl">
          New product
        </h1>
        <div className="mt-8">
          <ProductEditor product={null} />
        </div>
      </div>
    </section>
  );
}
