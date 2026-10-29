'use server';

import { previewStoredCart } from '@/lib/shop-catalog';
import type { CartPreview } from '@/lib/shop-display';

export async function previewCart(input: unknown): Promise<CartPreview> {
  return previewStoredCart(input);
}
