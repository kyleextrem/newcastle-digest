import 'server-only';

import { redirect } from 'next/navigation';
import { getAuth } from '@/auth';
import { isAllowedAdminEmail, isShopAdminConfigured, parseAdminEmails } from '@/lib/shop-admin-policy';

export async function getShopAdminSession(): Promise<{ email: string } | null> {
  if (!isShopAdminConfigured()) {
    return null;
  }
  const auth = getAuth();
  if (!auth) {
    return null;
  }
  const session = await auth.auth();
  const email = session?.user?.email;
  if (!email || !isAllowedAdminEmail(email, parseAdminEmails(process.env.SHOP_ADMIN_EMAILS))) {
    return null;
  }
  return { email };
}

export async function requireShopAdmin(): Promise<{ email: string }> {
  const admin = await getShopAdminSession();
  if (!admin) {
    redirect('/shop/admin/sign-in');
  }
  return admin;
}
