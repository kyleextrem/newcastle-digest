import { redirect } from 'next/navigation';
import { getAuth } from '@/auth';
import { isAllowedAdminEmail, isShopAdminConfigured, parseAdminEmails } from '@/lib/shop-admin-policy';

export const dynamic = 'force-dynamic';

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ShopAdminSignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const configured = isShopAdminConfigured();
  const auth = getAuth();
  const session = auth ? await auth.auth() : null;
  const email = session?.user?.email ?? '';
  const allowed = Boolean(email) && isAllowedAdminEmail(email, parseAdminEmails(process.env.SHOP_ADMIN_EMAILS));

  if (configured && allowed) {
    redirect('/shop/admin');
  }

  return (
    <section className="px-4 py-10 sm:px-6 md:px-8 md:py-16">
      <div className="container mx-auto max-w-xl">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">Newcastle Digest</p>
        <h1 className="mt-3 font-sans-main text-5xl font-black uppercase tracking-tighter text-[#251f18] md:text-7xl">
          Shop admin
        </h1>
        <p className="mt-4 font-sans-main text-lg leading-relaxed text-[#251f18]/70">
          Only a verified Google account on the shop administrator list can open this. The address of
          this page is not enough.
        </p>

        {params.error === 'AccessDenied' || (email && !allowed) ? (
          <p className="mt-6 rounded-2xl bg-[#251f18] px-4 py-3 font-sans-main text-sm text-white" role="alert">
            That Google account is not allowed to administer the shop.
          </p>
        ) : null}

        {configured && auth ? (
          <form
            className="mt-8"
            action={async () => {
              'use server';
              const current = getAuth();
              if (!current) {
                return;
              }
              await current.signIn('google', { redirectTo: '/shop/admin' });
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-[#849bff] px-8 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6]"
            >
              Sign in with Google
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4 rounded-[24px] bg-white p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Sign-in is not set up yet</h2>
            <ol className="list-decimal space-y-3 pl-5 font-sans-main text-base leading-relaxed text-[#251f18]/75">
              <li>In Google Cloud, create an OAuth client ID for a web application.</li>
              <li>
                Add the redirect URI <span className="break-all">http://localhost:3004/api/auth/callback/google</span>.
              </li>
              <li>On the OAuth consent screen, add the administrator&apos;s Google account as a test user.</li>
              <li>
                Add <span className="font-mono-main text-sm">AUTH_SECRET</span>,{' '}
                <span className="font-mono-main text-sm">AUTH_GOOGLE_ID</span>,{' '}
                <span className="font-mono-main text-sm">AUTH_GOOGLE_SECRET</span>,{' '}
                <span className="font-mono-main text-sm">AUTH_URL=http://localhost:3004</span>, and{' '}
                <span className="font-mono-main text-sm">SHOP_ADMIN_EMAILS</span> to{' '}
                <span className="font-mono-main text-sm">.env.local</span>. Generate{' '}
                <span className="font-mono-main text-sm">AUTH_SECRET</span> with{' '}
                <span className="font-mono-main text-sm">openssl rand -base64 32</span>.
              </li>
              <li>Restart the dev server, then open this page again.</li>
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
