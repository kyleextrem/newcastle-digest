import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  googleAccountMayAdminister,
  isShopAdminConfigured,
  parseAdminEmails,
} from '@/lib/shop-admin-policy';

type ShopAuth = ReturnType<typeof NextAuth>;

let cached: ShopAuth | null = null;

export function getAuth(): ShopAuth | null {
  const secret = process.env.AUTH_SECRET;
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!secret || !clientId || !clientSecret || !isShopAdminConfigured()) {
    return null;
  }
  if (!cached) {
    const allowlist = parseAdminEmails(process.env.SHOP_ADMIN_EMAILS);
    cached = NextAuth({
      trustHost: true,
      secret,
      session: { strategy: 'jwt' },
      pages: {
        signIn: '/shop/admin/sign-in',
        error: '/shop/admin/sign-in',
      },
      providers: [
        Google({
          clientId,
          clientSecret,
        }),
      ],
      callbacks: {
        async signIn({ account, profile }) {
          const record = profile as { email?: unknown; email_verified?: unknown } | undefined;
          return googleAccountMayAdminister(
            {
              provider: account?.provider,
              email: record?.email,
              emailVerified: record?.email_verified,
            },
            allowlist,
          );
        },
      },
    });
  }
  return cached;
}
