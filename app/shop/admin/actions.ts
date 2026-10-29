'use server';

import { unstable_rethrow } from 'next/navigation';
import { packAdminOrder, refundAdminOrder, shipAdminOrder } from '@/lib/shop-admin-orders';
import { AdminInputError } from '@/lib/shop-admin-policy';
import {
  databaseSafeMessage,
  deleteAdminProduct,
  logAdminDatabaseError,
  saveAdminProduct,
} from '@/lib/shop-admin-products';
import { requireShopAdmin } from '@/lib/shop-admin-session';
import type { AdminActionResult } from '@/lib/shop-admin-types';

export async function saveProductAction(input: unknown): Promise<AdminActionResult> {
  await requireShopAdmin();
  try {
    const id = await saveAdminProduct(input);
    return { ok: true, id };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminInputError) {
      return { ok: false, error: error.message };
    }
    logAdminDatabaseError('Shop admin save failed', error);
    return { ok: false, error: databaseSafeMessage(error) };
  }
}

export async function deleteProductAction(id: string): Promise<AdminActionResult> {
  await requireShopAdmin();
  try {
    await deleteAdminProduct(id);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminInputError) {
      return { ok: false, error: error.message };
    }
    logAdminDatabaseError('Shop admin delete failed', error);
    return { ok: false, error: databaseSafeMessage(error) };
  }
}

export async function packOrderAction(id: string): Promise<AdminActionResult> {
  await requireShopAdmin();
  try {
    await packAdminOrder(id);
    return { ok: true, id };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminInputError) {
      return { ok: false, error: error.message };
    }
    logAdminDatabaseError('Shop admin pack failed', error);
    return { ok: false, error: databaseSafeMessage(error) };
  }
}

export async function shipOrderAction(input: {
  id: string;
  carrier?: string;
  trackingNumber?: string;
}): Promise<AdminActionResult> {
  await requireShopAdmin();
  try {
    await shipAdminOrder(input);
    return { ok: true, id: input.id };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminInputError) {
      return { ok: false, error: error.message };
    }
    logAdminDatabaseError('Shop admin ship failed', error);
    return { ok: false, error: databaseSafeMessage(error) };
  }
}

export async function refundOrderAction(input: {
  id: string;
  amount?: string;
}): Promise<AdminActionResult> {
  await requireShopAdmin();
  try {
    await refundAdminOrder(input);
    return { ok: true, id: input.id };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminInputError) {
      return { ok: false, error: error.message };
    }
    logAdminDatabaseError('Shop admin refund failed', error);
    return { ok: false, error: databaseSafeMessage(error) };
  }
}
