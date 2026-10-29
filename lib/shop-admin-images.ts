export const SHOP_IMAGE_MAX_BYTES = 3_500_000;
export const SHOP_IMAGE_UPLOAD_CONCURRENCY = 3;
export const SHOP_IMAGE_UPLOAD_TIMEOUT_MS = 45_000;
export const SHOP_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export type ShopImageType = (typeof SHOP_IMAGE_TYPES)[number];

export type ShopImageInspection =
  | { ok: true; contentType: ShopImageType; filename: string }
  | { ok: false; message: string };

const TYPE_SET = new Set<string>(SHOP_IMAGE_TYPES);

export function inspectShopImage(input: {
  name: string;
  size: number;
  type: string;
  bytes: Uint8Array;
}): ShopImageInspection {
  if (!Number.isInteger(input.size) || input.size <= 0) {
    return { ok: false, message: 'Choose a JPEG, PNG, WebP, or GIF under 3.5 MB.' };
  }
  if (input.size > SHOP_IMAGE_MAX_BYTES) {
    return { ok: false, message: 'That photo is larger than 3.5 MB.' };
  }
  if (input.bytes.byteLength !== input.size) {
    return { ok: false, message: 'That photo could not be read.' };
  }

  const sniffed = sniffImageType(input.bytes);
  if (!sniffed) {
    return { ok: false, message: 'Choose a JPEG, PNG, WebP, or GIF.' };
  }

  const declared = normalizeDeclaredType(input.type);
  if (declared && declared !== sniffed) {
    return { ok: false, message: 'That file type does not match the photo.' };
  }

  return {
    ok: true,
    contentType: sniffed,
    filename: safeImageFilename(input.name, sniffed),
  };
}

export function isShopImageType(value: string): value is ShopImageType {
  return TYPE_SET.has(value);
}

export function isPersistedImageUrl(url: string): boolean {
  return url.startsWith('https://');
}

export async function runWithLimit<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  const concurrency = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item === undefined) {
        continue;
      }
      await worker(item, index);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => run()));
}

function normalizeDeclaredType(value: string): ShopImageType | null {
  const type = value.trim().toLowerCase();
  if (type === 'image/jpg') {
    return 'image/jpeg';
  }
  if (isShopImageType(type)) {
    return type;
  }
  return null;
}

function sniffImageType(bytes: Uint8Array): ShopImageType | null {
  if (bytes.length < 12) {
    return null;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  const header = String.fromCharCode(...bytes.subarray(0, 4));
  const webp = String.fromCharCode(...bytes.subarray(8, 12));
  if (header === 'RIFF' && webp === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

function safeImageFilename(name: string, contentType: ShopImageType): string {
  const base = name.split(/[/\\]/).pop()?.trim() || 'image';
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  const withExt = cleaned.includes('.') ? cleaned : `${cleaned || 'image'}${extensionFor(contentType)}`;
  return `shop-${withExt}`;
}

function extensionFor(contentType: ShopImageType): string {
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default: {
      const unreachable: never = contentType;
      return unreachable;
    }
  }
}
