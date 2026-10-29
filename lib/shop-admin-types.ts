import type { ProductKind, ProductStatus } from '@/lib/shop-admin-policy';

export type AdminStock = {
  inventoryId: string | null;
  onHand: number;
  reserved: number;
  available: number;
};

export type AdminVariantView = {
  id: string;
  name: string;
  sku: string;
  price: string;
  active: boolean;
  removable: boolean;
  stock: AdminStock;
};

export type AdminImageView = {
  id: string;
  url: string;
  alt: string;
  variantId: string | null;
};

export type AdminMovement = {
  id: string;
  variantName: string | null;
  type: string;
  onHandDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  note: string;
  createdAt: string;
};

export type AdminProductView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  requiresShipping: boolean;
  status: ProductStatus;
  kind: ProductKind;
  kindLocked: boolean;
  price: string;
  sku: string;
  canDelete: boolean;
  stock: AdminStock | null;
  variants: AdminVariantView[];
  images: AdminImageView[];
  movements: AdminMovement[];
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  kind: ProductKind;
  onHand: number;
  reserved: number;
  available: number;
};

export type AdminActionResult = { ok: true; id?: string } | { ok: false; error: string };
