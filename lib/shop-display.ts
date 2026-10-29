export const CART_STORAGE_KEY = 'newcastle-digest-shop-cart';
export const CART_VERSION = 1;
export const MAX_CART_QUANTITY = 20;
export const MAX_CART_LINES = 30;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const audCurrency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type CartLineState = 'available' | 'limited' | 'sold_out' | 'unavailable';

export type CartCatalogRow = {
  productId: string;
  variantId: string | null;
  productFound: boolean;
  active: boolean;
  hasVariants: boolean;
  variantFound: boolean;
  variantActive: boolean;
  productName: string | null;
  variantName: string | null;
  slug: string | null;
  priceCents: number | null;
  available: number;
  imageUrl: string | null;
  imageAlt: string;
};

export type CartPreviewLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  variantName: string | null;
  slug: string | null;
  unitPriceLabel: string | null;
  linePriceLabel: string | null;
  available: number;
  imageUrl: string | null;
  imageAlt: string;
  state: CartLineState;
};

export type CartPreview = {
  lines: CartPreviewLine[];
  totalLabel: string | null;
  checkoutAvailable: boolean;
  loadFailed: boolean;
};

export function formatAudCents(cents: number): string {
  return audCurrency.format(cents / 100);
}

export function cataloguePriceLabel(input: {
  priceCents: number | null;
  variantCount: number;
  minVariantPriceCents: number | null;
  maxVariantPriceCents: number | null;
}): string {
  if (input.variantCount > 0) {
    const { minVariantPriceCents, maxVariantPriceCents } = input;
    if (minVariantPriceCents === null || maxVariantPriceCents === null) {
      return 'Price unavailable';
    }
    if (minVariantPriceCents === maxVariantPriceCents) {
      return formatAudCents(minVariantPriceCents);
    }
    return `From ${formatAudCents(minVariantPriceCents)}`;
  }

  if (input.priceCents === null) {
    return 'Price unavailable';
  }

  return formatAudCents(input.priceCents);
}

export function availabilityLabel(available: number): string {
  if (available <= 0) {
    return 'Sold out';
  }
  if (available === 1) {
    return 'Only 1 left';
  }
  if (available <= 5) {
    return `Only ${available} left`;
  }
  return 'In stock';
}

export function cartLineKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? ''}`;
}

export function cartLineState(input: {
  productFound: boolean;
  active: boolean;
  hasVariants: boolean;
  variantId: string | null;
  variantFound: boolean;
  variantActive: boolean;
  priceCents: number | null;
  available: number;
  quantity: number;
}): CartLineState {
  if (!input.productFound || !input.active || input.priceCents === null) {
    return 'unavailable';
  }

  if (input.hasVariants) {
    if (input.variantId === null || !input.variantFound || !input.variantActive) {
      return 'unavailable';
    }
  } else if (input.variantId !== null) {
    return 'unavailable';
  }

  if (input.available <= 0) {
    return 'sold_out';
  }
  if (input.quantity > input.available) {
    return 'limited';
  }
  return 'available';
}

export function parseCart(value: unknown): CartItem[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as { version?: unknown; items?: unknown };
  if (record.version !== CART_VERSION || !Array.isArray(record.items)) {
    return [];
  }

  const items: CartItem[] = [];
  for (const entry of record.items) {
    const item = parseCartItem(entry);
    if (!item) {
      continue;
    }

    const existing = items.find(
      (candidate) =>
        candidate.productId === item.productId && candidate.variantId === item.variantId,
    );
    if (existing) {
      existing.quantity = Math.min(MAX_CART_QUANTITY, existing.quantity + item.quantity);
      continue;
    }
    if (items.length >= MAX_CART_LINES) {
      continue;
    }
    items.push(item);
  }

  return items;
}

export function readStoredCart(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }
  try {
    return parseCart(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({
    version: CART_VERSION,
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  });
}

export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find(
    (candidate) =>
      candidate.productId === item.productId && candidate.variantId === item.variantId,
  );
  if (!existing) {
    if (items.length >= MAX_CART_LINES) {
      return items;
    }
    return [...items, { ...item, quantity: Math.min(MAX_CART_QUANTITY, item.quantity) }];
  }

  return items.map((candidate) => {
    if (candidate !== existing) {
      return candidate;
    }
    return {
      ...candidate,
      quantity: Math.min(MAX_CART_QUANTITY, candidate.quantity + item.quantity),
    };
  });
}

export function setCartQuantity(
  items: CartItem[],
  productId: string,
  variantId: string | null,
  quantity: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return items.filter(
      (item) => item.productId !== productId || item.variantId !== variantId,
    );
  }

  const nextQuantity = Math.min(MAX_CART_QUANTITY, quantity);
  return items.map((item) => {
    if (item.productId !== productId || item.variantId !== variantId) {
      return item;
    }
    return { ...item, quantity: nextQuantity };
  });
}

export function removeCartItem(
  items: CartItem[],
  productId: string,
  variantId: string | null,
): CartItem[] {
  return items.filter((item) => item.productId !== productId || item.variantId !== variantId);
}

export function buildCartPreview(items: CartItem[], rows: CartCatalogRow[]): CartPreview {
  const byKey = new Map(rows.map((row) => [cartLineKey(row.productId, row.variantId), row]));
  let totalCents = 0;
  let pricedLines = 0;

  const lines = items.map((item) => {
    const row = byKey.get(cartLineKey(item.productId, item.variantId));
    const state = cartLineState({
      productFound: row?.productFound ?? false,
      active: row?.active ?? false,
      hasVariants: row?.hasVariants ?? false,
      variantId: item.variantId,
      variantFound: row?.variantFound ?? false,
      variantActive: row?.variantActive ?? false,
      priceCents: row?.priceCents ?? null,
      available: row?.available ?? 0,
      quantity: item.quantity,
    });
    const priceCents = state === 'unavailable' ? null : (row?.priceCents ?? null);
    const unitPriceLabel = priceCents === null ? null : formatAudCents(priceCents);
    const lineCents = priceCents === null ? null : priceCents * item.quantity;
    const safeLineCents = lineCents !== null && Number.isSafeInteger(lineCents) ? lineCents : null;
    const linePriceLabel = safeLineCents === null ? null : formatAudCents(safeLineCents);

    if (safeLineCents !== null && (state === 'available' || state === 'limited')) {
      totalCents += safeLineCents;
      pricedLines += 1;
    }

    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      name: row?.productName || 'Unavailable item',
      variantName: row?.variantName ?? null,
      slug: row?.slug ?? null,
      unitPriceLabel,
      linePriceLabel,
      available: row?.available ?? 0,
      imageUrl: state === 'unavailable' ? null : (row?.imageUrl ?? null),
      imageAlt: row?.imageAlt || row?.productName || '',
      state,
    };
  });

  return {
    lines,
    totalLabel:
      pricedLines > 0 && Number.isSafeInteger(totalCents) ? formatAudCents(totalCents) : null,
    checkoutAvailable: lines.length > 0 && lines.every((line) => line.state === 'available'),
    loadFailed: false,
  };
}

function parseCartItem(entry: unknown): CartItem | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  if (!isUuid(candidate.productId)) {
    return null;
  }

  const variantId = candidate.variantId;
  if (variantId !== null && !isUuid(variantId)) {
    return null;
  }

  if (
    typeof candidate.quantity !== 'number' ||
    !Number.isInteger(candidate.quantity) ||
    candidate.quantity < 1
  ) {
    return null;
  }

  return {
    productId: candidate.productId.toLowerCase(),
    variantId: variantId === null ? null : variantId.toLowerCase(),
    quantity: Math.min(MAX_CART_QUANTITY, candidate.quantity),
  };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
