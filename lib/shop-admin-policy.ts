export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export const PRODUCT_KINDS = ['simple', 'variants'] as const;
export const MAX_PRODUCT_IMAGES = 24;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type ProductKind = (typeof PRODUCT_KINDS)[number];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PRICE_CENTS = 10_000_000;
const MAX_ON_HAND = 1_000_000;

export class AdminInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminInputError';
  }
}

export type ParsedVariant = {
  id: string | null;
  name: string;
  sku: string;
  priceCents: number;
  active: boolean;
  onHand: number | null;
  remove: boolean;
};

export type ParsedImage = {
  id: string | null;
  url: string;
  alt: string;
  variantId: string | null;
};

export type ParsedProduct = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  requiresShipping: boolean;
  status: ProductStatus;
  kind: ProductKind;
  priceCents: number | null;
  sku: string | null;
  onHand: number | null;
  variants: ParsedVariant[];
  images: ParsedImage[];
};

export type StockDecision =
  | { action: 'unchanged' }
  | { action: 'open'; quantity: number }
  | { action: 'adjust'; nextOnHand: number; delta: number }
  | { action: 'invalid'; message: string };

export function parseAdminEmails(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const emails = value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => EMAIL_PATTERN.test(email));
  return [...new Set(emails)];
}

export function isAllowedAdminEmail(email: string, allowlist: readonly string[]): boolean {
  return allowlist.includes(email.trim().toLowerCase());
}

export function shopAdminIsConfigured(env: Record<string, string | undefined>): boolean {
  return Boolean(
    env.AUTH_SECRET &&
      env.AUTH_GOOGLE_ID &&
      env.AUTH_GOOGLE_SECRET &&
      parseAdminEmails(env.SHOP_ADMIN_EMAILS).length > 0,
  );
}

export function isShopAdminConfigured(): boolean {
  return shopAdminIsConfigured(process.env);
}

export function googleAccountMayAdminister(
  input: { provider: string | undefined; email: unknown; emailVerified: unknown },
  allowlist: readonly string[],
): boolean {
  if (input.provider !== 'google' || input.emailVerified !== true) {
    return false;
  }
  if (typeof input.email !== 'string') {
    return false;
  }
  return isAllowedAdminEmail(input.email, allowlist);
}

export function slugifyProductName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function parseAudToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > MAX_PRICE_CENTS) {
    return null;
  }
  return cents;
}

export function formatCentsForInput(cents: number | null): string {
  if (cents === null) {
    return '';
  }
  return (cents / 100).toFixed(2);
}

export function decideStockChange(input: {
  hasInventory: boolean;
  onHand: number;
  reserved: number;
  desired: number | null;
}): StockDecision {
  if (input.desired === null) {
    return { action: 'unchanged' };
  }
  if (!Number.isInteger(input.desired) || input.desired < 0 || input.desired > MAX_ON_HAND) {
    return {
      action: 'invalid',
      message: 'On-hand stock must be a whole number from 0 to 1,000,000.',
    };
  }
  if (!input.hasInventory) {
    return { action: 'open', quantity: input.desired };
  }
  if (input.desired < input.reserved) {
    return {
      action: 'invalid',
      message: 'On-hand stock cannot be lower than the units already reserved.',
    };
  }
  if (input.desired === input.onHand) {
    return { action: 'unchanged' };
  }
  return {
    action: 'adjust',
    nextOnHand: input.desired,
    delta: input.desired - input.onHand,
  };
}

export function parseProductDraft(input: unknown): ParsedProduct {
  if (!input || typeof input !== 'object') {
    throw new AdminInputError('The product could not be read.');
  }
  const record = input as Record<string, unknown>;
  const status = parseStatus(record.status);
  const kind = parseKind(record.kind);
  const name = requiredText(record.name, 'Enter a product name.', 160);
  const slugSource = typeof record.slug === 'string' && record.slug.trim() ? record.slug : name;
  const slug = slugifyProductName(slugSource);
  if (!SLUG_PATTERN.test(slug)) {
    throw new AdminInputError('Use a link made of lowercase letters, numbers, and hyphens.');
  }

  const description = optionalText(record.description, 8000);
  const requiresShipping = record.requiresShipping === true;
  const id = optionalUuid(record.id, 'That product could not be found.');

  if (kind === 'simple') {
    if (Array.isArray(record.variants) && record.variants.length > 0) {
      throw new AdminInputError('A simple product cannot include options.');
    }
    const priceCents = optionalPrice(record.price);
    const sku = optionalSku(record.sku);
    if (status === 'active' && (priceCents === null || sku === null)) {
      throw new AdminInputError('Add a price and SKU before publishing.');
    }
    if (status === 'active' && (record.onHand === null || record.onHand === undefined)) {
      throw new AdminInputError('Enter on-hand stock before publishing.');
    }
    return {
      id,
      name,
      slug,
      description,
      requiresShipping,
      status,
      kind,
      priceCents,
      sku,
      onHand: optionalOnHand(record.onHand),
      variants: [],
      images: parseImages(record.images, 'simple'),
    };
  }

  if (optionalPrice(record.price) !== null || optionalSku(record.sku) !== null) {
    throw new AdminInputError('A product with options keeps its price and SKU on each option.');
  }
  const variants = parseVariants(record.variants);
  if (status === 'active' && !variants.some((variant) => variant.active && !variant.remove)) {
    throw new AdminInputError('Add an active option before publishing.');
  }
  return {
    id,
    name,
    slug,
    description,
    requiresShipping,
    status,
    kind,
    priceCents: null,
    sku: null,
    onHand: null,
    variants,
    images: parseImages(record.images, 'variants'),
  };
}

function parseVariants(value: unknown): ParsedVariant[] {
  if (!Array.isArray(value)) {
    throw new AdminInputError('Add the product options again.');
  }
  if (value.length > 30) {
    throw new AdminInputError('A product can have at most 30 options.');
  }
  const variants = value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new AdminInputError('One of the options could not be read.');
    }
    const variant = entry as Record<string, unknown>;
    const remove = variant.remove === true;
    const id = optionalUuid(variant.id, 'One of the options could not be found.');
    if (remove) {
      if (!id) {
        throw new AdminInputError('A new option cannot be removed before it is saved.');
      }
      return {
        id,
        name: 'Removed option',
        sku: 'removed',
        priceCents: 0,
        active: false,
        onHand: null,
        remove: true,
      };
    }
    const priceCents = optionalPrice(variant.price);
    const sku = optionalSku(variant.sku);
    if (priceCents === null || sku === null) {
      throw new AdminInputError('Each option needs a price and SKU.');
    }
    return {
      id,
      name: requiredText(variant.name, 'Each option needs a name.', 160),
      sku,
      priceCents,
      active: variant.active !== false,
      onHand: optionalOnHand(variant.onHand),
      remove: false,
    };
  });

  const seen = new Set<string>();
  for (const variant of variants) {
    if (variant.remove) {
      continue;
    }
    const key = variant.sku.toLowerCase();
    if (seen.has(key)) {
      throw new AdminInputError('Each option needs its own SKU.');
    }
    seen.add(key);
  }
  return variants;
}

function parseImages(value: unknown, kind: ProductKind): ParsedImage[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new AdminInputError('The images could not be read.');
  }
  if (value.length > MAX_PRODUCT_IMAGES) {
    throw new AdminInputError(`A product can have at most ${MAX_PRODUCT_IMAGES} images.`);
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new AdminInputError('One of the images could not be read.');
    }
    const image = entry as Record<string, unknown>;
    const variantId = optionalUuid(image.variantId, 'One of the images is attached to an unknown option.');
    if (kind === 'simple' && variantId) {
      throw new AdminInputError('A simple product cannot have option photos.');
    }
    return {
      id: optionalUuid(image.id, 'One of the images could not be found.'),
      url: httpsUrl(image.url),
      alt: optionalText(image.alt, 300),
      variantId,
    };
  });
}

function parseStatus(value: unknown): ProductStatus {
  if (value === 'draft' || value === 'active' || value === 'archived') {
    return value;
  }
  throw new AdminInputError('Choose draft, published, or archived.');
}

function parseKind(value: unknown): ProductKind {
  if (value === 'simple' || value === 'variants') {
    return value;
  }
  throw new AdminInputError('Choose a simple product or a product with options.');
}

function requiredText(value: unknown, message: string, max: number): string {
  if (typeof value !== 'string') {
    throw new AdminInputError(message);
  }
  const text = value.trim();
  if (!text || text.length > max) {
    throw new AdminInputError(message);
  }
  return text;
}

function optionalText(value: unknown, max: number): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new AdminInputError('That text is too long.');
  }
  return value.trim();
}

function optionalSku(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new AdminInputError('Enter a SKU.');
  }
  const sku = value.trim();
  if (!sku || sku.length > 64 || /\s/.test(sku)) {
    throw new AdminInputError('A SKU can be up to 64 characters with no spaces.');
  }
  return sku;
}

function optionalPrice(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new AdminInputError('Enter a price in Australian dollars.');
  }
  const cents = parseAudToCents(value);
  if (cents === null) {
    throw new AdminInputError('Enter a price in Australian dollars, such as 24 or 24.50.');
  }
  return cents;
}

function optionalOnHand(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new AdminInputError('On-hand stock must be a whole number.');
  }
  return value;
}

function optionalUuid(value: unknown, message: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new AdminInputError(message);
  }
  return value.toLowerCase();
}

function httpsUrl(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AdminInputError('Each image needs an https link.');
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new AdminInputError('Each image needs an https link.');
  }
  if (url.protocol !== 'https:' || url.toString().length > 2000) {
    throw new AdminInputError('Each image needs an https link.');
  }
  return url.toString();
}
