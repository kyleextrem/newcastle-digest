export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { inspectShopImage } from '@/lib/shop-admin-images';
import { AdminInputError } from '@/lib/shop-admin-policy';
import { uploadShopImageAsset } from '@/lib/shop-admin-sanity';
import { getShopAdminSession } from '@/lib/shop-admin-session';

export async function POST(request: Request) {
  const admin = await getShopAdminSession();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Sign in to upload shop images.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('That photo could not be read.', 400);
  }

  const file = form.get('file');
  if (!isUploadFile(file)) {
    return fail('Choose a photo to upload.', 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const inspection = inspectShopImage({
    name: file.name,
    size: bytes.byteLength,
    type: file.type,
    bytes,
  });
  if (!inspection.ok) {
    return fail(inspection.message, 400);
  }

  try {
    const uploaded = await uploadShopImageAsset({
      bytes,
      filename: inspection.filename,
      contentType: inspection.contentType,
    });
    return NextResponse.json(
      { ok: true, url: uploaded.url },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof AdminInputError) {
      return fail(error.message, 400);
    }
    console.error('Shop admin image upload failed');
    return fail('The image could not be uploaded. Try again.', 502);
  }
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'arrayBuffer' in value &&
      'name' in value &&
      'size' in value &&
      'type' in value,
  );
}
