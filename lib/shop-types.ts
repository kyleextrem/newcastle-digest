export type ShopImage = {
  id: string;
  variantId: string | null;
  url: string;
  alt: string;
};

export type ShopVariant = {
  id: string;
  name: string;
  priceCents: number;
  available: number;
};

export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number | null;
  requiresShipping: boolean;
  available: number;
  variants: ShopVariant[];
  images: ShopImage[];
};

export type ShopProductCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceLabel: string;
  availabilityLabel: string;
  soldOut: boolean;
  imageUrl: string | null;
  imageAlt: string;
};
