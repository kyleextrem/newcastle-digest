import 'server-only';

import { createClient, type SanityImageAssetDocument } from '@sanity/client';
import { AdminInputError } from '@/lib/shop-admin-policy';
import type { ShopImageType } from '@/lib/shop-admin-images';

export async function uploadShopImageAsset(input: {
  bytes: Buffer;
  filename: string;
  contentType: ShopImageType;
}): Promise<{ url: string }> {
  const client = shopImageWriteClient();
  let asset: SanityImageAssetDocument;
  try {
    asset = await client.assets.upload('image', input.bytes, {
      filename: input.filename,
      contentType: input.contentType,
      label: 'newcastle-digest-shop',
    });
  } catch (error) {
    throw sanityUploadError(error);
  }
  const url = typeof asset.url === 'string' ? asset.url.trim() : '';
  if (!url.startsWith('https://')) {
    throw new AdminInputError('Sanity did not return an image link.');
  }
  return { url };
}

function shopImageWriteClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    throw new AdminInputError(
      'Image storage is not configured. Add SANITY_API_TOKEN with permission to upload assets.',
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    useCdn: false,
    token,
  });
}

function sanityUploadError(error: unknown): AdminInputError {
  const record = error && typeof error === 'object' ? (error as { statusCode?: number; status?: number }) : {};
  const status = record.statusCode ?? record.status;
  if (status === 401 || status === 403) {
    return new AdminInputError(
      'Sanity could not store this image. The API token needs permission to upload assets.',
    );
  }
  return new AdminInputError('The image could not be uploaded. Try again.');
}
