import { ShopCartProvider } from '@/components/shop/ShopCartProvider';

export const dynamic = 'force-dynamic';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopCartProvider>{children}</ShopCartProvider>;
}
