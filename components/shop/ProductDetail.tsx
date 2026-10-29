'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
  MAX_CART_QUANTITY,
  availabilityLabel,
  formatAudCents,
} from '@/lib/shop-display';
import type { ShopProduct } from '@/lib/shop-types';
import { useShopCart } from '@/components/shop/ShopCartProvider';

export function ProductDetail({ product }: { product: ShopProduct }) {
  const hasVariants = product.variants.length > 0;
  const firstAvailable = product.variants.find((variant) => variant.available > 0);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const variantGroupId = useId();
  const { items, addItem } = useShopCart();

  const selectedVariant = hasVariants
    ? product.variants.find((variant) => variant.id === selectedId) ?? product.variants[0]
    : undefined;
  const available = selectedVariant ? selectedVariant.available : product.available;
  const priceCents = selectedVariant ? selectedVariant.priceCents : product.priceCents;
  const pricesDiffer =
    hasVariants &&
    product.variants.some((variant) => variant.priceCents !== product.variants[0]?.priceCents);

  const images = useMemo(() => {
    if (selectedVariant) {
      const variantImages = product.images.filter((image) => image.variantId === selectedVariant.id);
      if (variantImages.length > 0) {
        return variantImages;
      }
    }
    const shared = product.images.filter((image) => image.variantId === null);
    return shared.length > 0 ? shared : product.images;
  }, [product.images, selectedVariant]);

  useEffect(() => {
    setImageIndex(0);
  }, [selectedVariant?.id]);

  const activeImage = images[imageIndex] ?? images[0];
  const inCart =
    items.find(
      (item) =>
        item.productId === product.id &&
        item.variantId === (selectedVariant ? selectedVariant.id : null),
    )?.quantity ?? 0;
  const room = Math.max(0, Math.min(available, MAX_CART_QUANTITY) - inCart);
  const soldOut = available <= 0 || priceCents === null;
  const selectedQuantity = room > 0 ? Math.min(quantity, room) : 1;
  const canAdd = !soldOut && room > 0 && selectedQuantity <= room;

  const selectVariant = (variantId: string) => {
    setSelectedId(variantId);
    setQuantity(1);
  };

  const addToCart = () => {
    if (!canAdd) {
      return;
    }
    addItem({
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      quantity: selectedQuantity,
    });
  };

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
          <div className="aspect-square bg-[#f5f4f0]">
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/30">
                  No image
                </span>
              </div>
            )}
          </div>
        </div>
        {images.length > 1 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === imageIndex}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border ${
                  index === imageIndex ? 'border-[#849bff]' : 'border-transparent'
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.95] text-[#251f18] md:text-6xl">
          {product.name}
        </h1>
        <p className="mt-5 font-sans-main text-2xl font-black text-[#251f18]">
          {priceCents === null ? 'Price unavailable' : formatAudCents(priceCents)}
        </p>
        <p className="mt-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
          {availabilityLabel(available)}
          {product.requiresShipping ? ' · Posted from Newcastle' : ' · Nothing to post'}
        </p>

        {product.description ? (
          <p className="mt-8 whitespace-pre-wrap font-sans-main text-lg leading-relaxed text-[#251f18]/75">
            {product.description}
          </p>
        ) : null}

        {hasVariants && selectedVariant ? (
          <fieldset className="mt-8">
            <legend id={variantGroupId} className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]">
              Choose an option
            </legend>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby={variantGroupId}>
              {product.variants.map((variant) => {
                const variantSoldOut = variant.available <= 0;
                const selected = variant.id === selectedVariant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variantSoldOut}
                    aria-pressed={selected}
                    onClick={() => selectVariant(variant.id)}
                    className={`rounded-full px-4 py-2.5 text-left font-sans-main text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? 'bg-[#849bff] text-white'
                        : 'bg-white text-[#251f18] shadow-sm hover:bg-[#849bff]/10'
                    }`}
                  >
                    {variant.name}
                    {pricesDiffer ? ` · ${formatAudCents(variant.priceCents)}` : ''}
                    {variantSoldOut ? ' · Sold out' : ''}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {room > 1 ? (
          <div className="mt-8 flex items-center gap-3">
            <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
              Quantity
            </span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, Math.min(current, room) - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-sans-main text-lg shadow-sm"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-6 text-center font-sans-main text-lg font-black">{selectedQuantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(room, current + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-sans-main text-lg shadow-sm"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={addToCart}
          disabled={!canAdd}
          className="mt-8 inline-flex rounded-full bg-[#849bff] px-8 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#6a7be6] disabled:cursor-not-allowed disabled:bg-[#251f18]/20 disabled:text-[#251f18]/50"
        >
          {soldOut ? 'Sold out' : room === 0 ? 'In your cart' : 'Add to cart'}
        </button>
        {inCart > 0 ? (
          <p className="mt-3 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
            {inCart} in your cart
          </p>
        ) : null}
        <p className="mt-4 max-w-md font-sans-main text-sm leading-relaxed text-[#251f18]/60">
          This cart is saved on this device only. Physical orders include a flat $5 shipping fee for
          Australian delivery. Price and stock are checked again before Stripe Checkout opens.
        </p>
      </div>
    </div>
  );
}
