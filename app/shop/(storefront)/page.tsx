import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ShopProductCardView } from '@/components/shop/ShopProductCard';
import { ShopEmptyState, ShopUnavailable } from '@/components/shop/ShopStatus';
import { listActiveProducts } from '@/lib/shop-catalog';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';
import type { ShopProductCard } from '@/lib/shop-types';

export const dynamic = 'force-dynamic';

const SHOP_TITLE = 'Shop';
const SHOP_HEADING = 'Made for the Newcastle obsessed.';
const SHOP_INTRO =
  'A little piece of Newcastle to take wherever you go. Thoughtful goods inspired by the city we call home.';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const products = await listActiveProducts();
    return {
      title: SHOP_TITLE,
      description: SHOP_INTRO,
      alternates: { canonical: '/shop' },
      robots: products.length === 0 ? { index: false, follow: false } : undefined,
      openGraph: {
        ...OPEN_GRAPH_WEBSITE,
        title: SHOP_TITLE,
        description: SHOP_INTRO,
        url: `${SITE_URL}/shop`,
      },
    };
  } catch {
    return {
      title: SHOP_TITLE,
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
      <ShopPageFrame>
        <ShopIntro />
        <ShopUnavailable />
      </ShopPageFrame>
    );
  }

  return (
    <ShopPageFrame>
      <ShopIntro />
      {products.length > 0 ? <ShopCollection products={products} /> : <ShopEmptyState />}
    </ShopPageFrame>
  );
}

function ShopPageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 md:px-8 md:pb-28 md:pt-10">
      <div className="container mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function ShopIntro() {
  return (
    <header className="mb-12 max-w-3xl border-b border-[#251f18]/10 pb-10 md:mb-16 md:pb-12">
      <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
        Digest Provisions
      </p>
      <h1 className="font-sans-main text-[2.15rem] font-black leading-[0.92] tracking-tighter text-[#251f18] sm:text-5xl md:text-6xl">
        {SHOP_HEADING}
      </h1>
      <p className="mt-5 max-w-xl font-sans-main text-lg leading-relaxed text-[#251f18]/60 md:mt-6 md:text-xl">
        {SHOP_INTRO}
      </p>
    </header>
  );
}

function ShopCollection({ products }: { products: ShopProductCard[] }) {
  const gridClassName =
    products.length === 1
      ? 'grid max-w-xl grid-cols-1 sm:max-w-2xl'
      : 'grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 md:gap-8';

  return (
    <section aria-labelledby="shop-collection-heading">
      <div className="mb-8 md:mb-10">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
          Shop
        </p>
        <h2
          id="shop-collection-heading"
          className="mt-3 font-sans-main text-3xl font-black uppercase leading-none tracking-tighter text-[#251f18] md:text-4xl"
        >
          The Collection
        </h2>
      </div>
      <div className={gridClassName}>
        {products.map((product) => (
          <ShopProductCardView key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
