import { getAuth } from '@/auth';
import { ShopAdminNav } from '@/components/shop-admin/ShopAdminNav';
import { requireShopAdmin } from '@/lib/shop-admin-session';

export const dynamic = 'force-dynamic';

export default async function ProtectedShopAdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireShopAdmin();

  return (
    <div className="bg-[#faf9f6]">
      <div className="container mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:px-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#251f18]/50">{email}</p>
          <form
            action={async () => {
              'use server';
              const auth = getAuth();
              if (!auth) {
                return;
              }
              await auth.signOut({ redirectTo: '/shop/admin/sign-in' });
            }}
          >
            <button
              type="submit"
              className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
            >
              Sign out
            </button>
          </form>
        </div>
        <ShopAdminNav />
      </div>
      {children}
    </div>
  );
}
