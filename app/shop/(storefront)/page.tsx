import type { Metadata } from 'next';
import { ShopProductCardView } from '@/components/shop/ShopProductCard';
import { ShopEmptyState, ShopUnavailable } from '@/components/shop/ShopStatus';
import { listActiveProducts } from '@/lib/shop-catalog';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const products = await listActiveProducts();
    return {
      title: 'Shop',
      description: 'Goods from Newcastle Digest.',
      alternates: { canonical: '/shop' },
      robots: products.length === 0 ? { index: false, follow: false } : undefined,
      openGraph: {
        ...OPEN_GRAPH_WEBSITE,
        title: 'Shop',
        description: 'Goods from Newcastle Digest.',
        url: `${SITE_URL}/shop`,
      },
    };
  } catch {
    return {
      title: 'Shop',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ShopPage() {
  let products;
  try {
    products = await listActiveProducts();
  } catch {
    return (
      <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <ShopHeading />
          <ShopUnavailable />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        <ShopHeading />
        {products.length === 0 ? (
          <ShopEmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {products.map((product) => (
              <ShopProductCardView key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ShopHeading() {
  return (
    <div className="mb-10 text-center md:mb-14">
      <p className="mb-3 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
        Newcastle Digest
      </p>
      <h1 className="mb-4 font-sans-main text-6xl font-black uppercase tracking-tighter leading-none text-[#251f18] md:text-8xl">
        Shop
      </h1>
      <p className="mx-auto max-w-xl font-sans-main text-lg leading-snug text-[#251f18]/60 md:text-xl">
        Goods from the Digest, priced in Australian dollars.
      </p>
    </div>
  );
}
