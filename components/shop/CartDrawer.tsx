'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  CART_VERSION,
  MAX_CART_QUANTITY,
  type CartItem,
  type CartLineState,
  type CartPreview,
} from '@/lib/shop-display';

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];
  preview: CartPreview | null;
  status: 'loading' | 'ready' | 'error';
  onClose: () => void;
  onQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  onRemove: (productId: string, variantId: string | null) => void;
};

export function CartDrawer({
  open,
  items,
  preview,
  status,
  onClose,
  onQuantity,
  onRemove,
}: CartDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const lines = preview?.lines ?? [];
  const empty = status !== 'loading' && lines.length === 0 && !preview?.loadFailed && status !== 'error';

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-[#251f18]/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#faf9f6] text-[#251f18] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#251f18]/10 px-5 py-5">
          <h2 id="shop-cart-title" className="font-sans-main text-2xl font-black uppercase tracking-tighter">
            Cart
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {status === 'loading' && lines.length === 0 ? (
            <p className="font-sans-main text-[#251f18]/60">Checking the shop…</p>
          ) : null}
          {status === 'error' || preview?.loadFailed ? (
            <p className="font-sans-main text-[#251f18]/70">
              Prices couldn&apos;t be checked. Nothing has been charged, and the cart is still saved
              on this device.
            </p>
          ) : null}
          {empty ? (
            <div>
              <p className="font-sans-main text-lg text-[#251f18]/70">Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="mt-6 inline-flex font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
              >
                Browse the shop
              </Link>
            </div>
          ) : null}
          <ul className="space-y-6">
            {lines.map((line) => (
              <li key={`${line.productId}:${line.variantId ?? ''}`} className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f5f4f0]">
                  {line.imageUrl ? (
                    <img src={line.imageUrl} alt={line.imageAlt || ''} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {line.slug && line.state !== 'unavailable' ? (
                    <Link
                      href={`/shop/${line.slug}`}
                      onClick={onClose}
                      className="font-sans-main text-lg font-black uppercase tracking-tighter leading-tight hover:text-[#849bff]"
                    >
                      {line.name}
                    </Link>
                  ) : (
                    <p className="font-sans-main text-lg font-black uppercase tracking-tighter leading-tight">
                      {line.name}
                    </p>
                  )}
                  {line.variantName ? (
                    <p className="mt-1 font-sans-main text-sm text-[#251f18]/60">{line.variantName}</p>
                  ) : null}
                  {line.unitPriceLabel ? (
                    <p className="mt-1 font-sans-main text-sm font-black">{line.unitPriceLabel}</p>
                  ) : null}
                  {lineNote(line.state, line.available) ? (
                    <p className="mt-1 font-sans-main text-sm text-[#251f18]/60">
                      {lineNote(line.state, line.available)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {line.state === 'unavailable' ? (
                      <span />
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease ${line.name}`}
                          onClick={() => onQuantity(line.productId, line.variantId, line.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
                        >
                          −
                        </button>
                        <span className="min-w-4 text-center font-sans-main text-sm font-black">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${line.name}`}
                          disabled={!canIncrease(line.state, line.quantity, line.available)}
                          onClick={() => onQuantity(line.productId, line.variantId, line.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(line.productId, line.variantId)}
                      className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45 hover:text-[#849bff]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#251f18]/10 px-5 py-5">
          {preview?.totalLabel ? (
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
                Estimated items
              </span>
              <span className="font-sans-main text-xl font-black">{preview.totalLabel}</span>
            </div>
          ) : null}
          {checkoutError ? (
            <p className="mb-3 font-sans-main text-sm text-[#251f18]" role="alert">
              {checkoutError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={checkingOut || !preview?.checkoutAvailable || status !== 'ready'}
            onClick={() => void startCheckout(items, setCheckoutError, setCheckingOut)}
            className="w-full rounded-full bg-[#849bff] px-6 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6] disabled:cursor-not-allowed disabled:bg-[#251f18]/15 disabled:text-[#251f18]/45"
          >
            {checkingOut ? 'Opening checkout' : 'Checkout'}
          </button>
          <p className="mt-3 font-sans-main text-sm leading-relaxed text-[#251f18]/60">
            Physical orders include a flat $5 shipping fee for Australian delivery. Prices and
            stock are checked again before Stripe Checkout opens.
          </p>
        </div>
      </aside>
    </div>
  );
}

async function startCheckout(
  items: CartItem[],
  setError: (message: string) => void,
  setCheckingOut: (value: boolean) => void,
): Promise<void> {
  setError('');
  setCheckingOut(true);
  try {
    const response = await fetch('/api/shop/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: CART_VERSION, items }),
    });
    const data: unknown = await response.json().catch(() => null);
    const url =
      data && typeof data === 'object' && 'url' in data && typeof data.url === 'string' ? data.url : null;
    if (!response.ok || !url || !url.startsWith('https://checkout.stripe.com/')) {
      setError(messageFromResponse(data) ?? 'The shop could not start checkout. Try again.');
      setCheckingOut(false);
      return;
    }
    window.location.assign(url);
  } catch {
    setError('The shop could not start checkout. Try again.');
    setCheckingOut(false);
  }
}

function messageFromResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('error' in data)) {
    return null;
  }
  const error = data.error;
  if (typeof error !== 'string' || error.length === 0 || error.length > 160) {
    return null;
  }
  if (/sk_|rk_|whsec_/.test(error)) {
    return null;
  }
  return error;
}

function canIncrease(state: CartLineState, quantity: number, available: number): boolean {
  switch (state) {
    case 'available':
      return quantity < available && quantity < MAX_CART_QUANTITY;
    case 'limited':
    case 'sold_out':
    case 'unavailable':
      return false;
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}

function lineNote(state: CartLineState, available: number): string | null {
  switch (state) {
    case 'available':
      return null;
    case 'limited':
      return available === 1 ? 'Only 1 is available.' : `Only ${available} are available.`;
    case 'sold_out':
      return 'Sold out.';
    case 'unavailable':
      return 'This is no longer in the shop.';
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}
