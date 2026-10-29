import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/shop/ProductDetail';
import { ShopUnavailable } from '@/components/shop/ShopStatus';
import { getActiveProduct } from '@/lib/shop-catalog';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getActiveProduct(slug);
    if (!product) {
      return { title: 'Product not found', robots: { index: false, follow: false } };
    }

    const description = product.description.trim().slice(0, 160) || `${product.name} from Newcastle Digest.`;
    const canonical = `/shop/${product.slug}`;
    const image = product.images.find((item) => item.variantId === null) ?? product.images[0];

    return {
      title: product.name,
      description,
      alternates: { canonical },
      openGraph: {
        title: product.name,
        description,
        type: 'website',
        locale: 'en_AU',
        siteName: SITE_NAME,
        url: `${SITE_URL}${canonical}`,
        ...(image ? { images: [{ url: image.url, alt: image.alt || product.name }] } : {}),
      },
    };
  } catch {
    return { title: 'Shop', robots: { index: false, follow: false } };
  }
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  let product;
  try {
    product = await getActiveProduct(slug);
  } catch {
    return (
      <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <ShopUnavailable />
        </div>
      </section>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        <Link
          href="/shop"
          className="mb-8 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
        >
          ← Shop
        </Link>
        <ProductDetail product={product} />
      </div>
    </section>
  );
}
