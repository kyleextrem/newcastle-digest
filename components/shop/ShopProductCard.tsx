import Link from 'next/link';
import type { ShopProductCard } from '@/lib/shop-types';

export function ShopProductCardView({ product }: { product: ShopProductCard }) {
  return (
    <article>
      <Link
        href={`/shop/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-[#f5f4f0] md:rounded-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#faf9f6]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.name}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/30">
                No image
              </span>
            </div>
          )}
          {product.soldOut ? (
            <span className="absolute left-4 top-4 rounded-full bg-[#251f18] px-3 py-1.5 font-mono-main text-[10px] uppercase tracking-widest text-white">
              Sold out
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col px-5 py-5 md:px-6 md:py-6">
          <h3 className="font-sans-main text-xl font-black uppercase leading-tight tracking-tighter text-[#251f18] transition-colors group-hover:text-[#849bff] md:text-2xl">
            {product.name}
          </h3>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="font-mono-main text-sm uppercase tracking-widest text-[#849bff]">
              {product.priceLabel}
            </p>
            <span className="inline-flex items-center gap-1.5 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18] transition-colors group-hover:text-[#849bff]">
              {product.soldOut ? 'View' : 'Shop'}
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
