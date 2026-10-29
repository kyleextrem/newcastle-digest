import { redirect } from 'next/navigation';
import { requireShopAdmin } from '@/lib/shop-admin-session';

export const dynamic = 'force-dynamic';

export default async function ShopAdminProductsIndexPage() {
  await requireShopAdmin();
  redirect('/shop/admin');
}
