'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag } from 'lucide-react';
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

export const SHOP_HEADER_CART_SLOT_ID = 'shop-header-cart';

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
      <ShopHeaderCartButton count={ready ? count : 0} onOpen={openCart} />
      {children}
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

function ShopHeaderCartButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setSlot(document.getElementById(SHOP_HEADER_CART_SLOT_ID));
  }, []);

  if (!slot) {
    return null;
  }

  const label = count > 0 ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart';

  return createPortal(
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#251f18] transition-colors hover:text-[#849bff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]"
    >
      <ShoppingBag size={22} strokeWidth={1.75} aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#849bff] px-1 font-mono-main text-[9px] leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>,
    slot,
  );
}
