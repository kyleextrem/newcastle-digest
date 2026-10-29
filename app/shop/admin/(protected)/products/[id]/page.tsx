import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductEditor } from '@/components/shop-admin/ProductEditor';
import { getAdminProduct } from '@/lib/shop-admin-products';
import { requireShopAdmin } from '@/lib/shop-admin-session';

export const dynamic = 'force-dynamic';

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditShopProductPage({ params }: EditProductPageProps) {
  await requireShopAdmin();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) {
    notFound();
  }

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
          {product.name}
        </h1>
        <div className="mt-8">
          <ProductEditor product={product} />
        </div>
      </div>
    </section>
  );
}
