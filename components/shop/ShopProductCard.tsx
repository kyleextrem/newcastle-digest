import Link from 'next/link';
import type { ShopProductCard } from '@/lib/shop-types';

export function ShopProductCardView({ product }: { product: ShopProductCard }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.01]">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-t-[24px] bg-[#f5f4f0]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt || product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      </Link>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <Link href={`/shop/${product.slug}`}>
          <h2 className="font-sans-main text-xl font-black uppercase tracking-tighter leading-tight text-[#251f18] transition-colors group-hover:text-[#849bff] md:text-2xl">
            {product.name}
          </h2>
        </Link>
        {product.description ? (
          <p className="mt-3 line-clamp-3 font-sans-main text-base leading-relaxed text-[#251f18]/60">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <p className="font-sans-main text-lg font-black text-[#251f18]">{product.priceLabel}</p>
          <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
            {product.availabilityLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
