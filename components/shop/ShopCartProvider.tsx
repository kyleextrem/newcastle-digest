'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { previewCart } from '@/app/shop/actions';
import { CartDrawer } from '@/components/shop/CartDrawer';
import {
  CART_STORAGE_KEY,
  CART_VERSION,
  addCartItem,
  readStoredCart,
  removeCartItem,
  serializeCart,
  setCartQuantity,
  type CartItem,
  type CartPreview,
} from '@/lib/shop-display';

type ShopCartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  openCart: () => void;
  clearCart: () => void;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function useShopCart(): ShopCartContextValue {
  const value = useContext(ShopCartContext);
  if (!value) {
    throw new Error('Shop cart is unavailable');
  }
  return value;
}

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [previewStatus, setPreviewStatus] = useState<'loading' | 'ready' | 'error'>('ready');

  useEffect(() => {
    setItems(readStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(items));
    } catch {
      console.error('Shop cart could not be saved on this device');
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (items.length === 0) {
      setPreview({
        lines: [],
        totalLabel: null,
        checkoutAvailable: false,
        loadFailed: false,
      });
      setPreviewStatus('ready');
      return;
    }
    let cancelled = false;
    setPreviewStatus('loading');
    previewCart({ version: CART_VERSION, items })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setPreview(result);
        setPreviewStatus(result.loadFailed ? 'error' : 'ready');
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => addCartItem(current, item));
    setOpen(true);
  }, []);

  const changeQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setItems((current) => setCartQuantity(current, productId, variantId, quantity));
    },
    [],
  );

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    setItems((current) => removeCartItem(current, productId, variantId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      openCart,
      clearCart,
    }),
    [items, addItem, openCart, clearCart],
  );

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ShopCartContext.Provider value={value}>
      <div className="bg-[#faf9f6]">
        <div className="container mx-auto flex max-w-6xl justify-end px-4 pt-6 sm:px-6 md:px-8">
          <button
            type="button"
            onClick={openCart}
            className="rounded-full border border-[#251f18] px-5 py-2.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-[#251f18] transition-colors hover:border-[#849bff] hover:text-[#849bff]"
          >
            Cart{ready && count > 0 ? ` (${count})` : ''}
          </button>
        </div>
        {children}
      </div>
      <CartDrawer
        open={open}
        items={items}
        preview={preview}
        status={previewStatus}
        onClose={closeCart}
        onQuantity={changeQuantity}
        onRemove={removeItem}
      />
    </ShopCartContext.Provider>
  );
}
