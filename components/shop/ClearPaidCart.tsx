'use client';

import { useEffect } from 'react';
import { useShopCart } from '@/components/shop/ShopCartProvider';

export function ClearPaidCart({ paid }: { paid: boolean }) {
  const { clearCart } = useShopCart();

  useEffect(() => {
    if (paid) {
      clearCart();
    }
  }, [paid, clearCart]);

  return null;
}
