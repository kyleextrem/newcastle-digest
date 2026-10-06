import type { Metadata } from 'next';
import Link from 'next/link';
import { confirmSupportCheckout } from '@/lib/confirm-support-session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Support Newcastle Digest | Newcastle Digest' },
  description: 'Support Newcastle Digest.',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SupportSuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;
  const confirmed = await confirmSupportCheckout(sessionId);

  return (
    <section className="bg-[#faf9f6] px-4 py-16 sm:px-6 md:px-8 md:py-28">
      <div className="mx-auto max-w-xl">
        {confirmed ? (
          <>
            <p className="mb-6 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
              Support Newcastle Digest
            </p>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl md:text-6xl">
              Thank you for supporting Newcastle Digest.
            </h1>
            <p className="mb-10 font-sans-main text-lg leading-relaxed text-[#251f18]/80 md:text-xl">
              Every contribution helps cover the costs of keeping Newcastle Digest running and growing.
            </p>
            <Link
              href="/"
              className="font-sans-main text-base text-[#849bff] underline underline-offset-2 hover:opacity-70"
            >
              Back to Newcastle Digest
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
              Support Newcastle Digest
            </p>
            <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl md:text-6xl">
              We have not confirmed this contribution.
            </h1>
            <p className="mb-10 font-sans-main text-lg leading-relaxed text-[#251f18]/80 md:text-xl">
              This page shows a thank you only after Stripe confirms the payment is complete. If you cancelled checkout, you can choose an amount again.
            </p>
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/support"
                className="font-sans-main text-base text-[#849bff] underline underline-offset-2 hover:opacity-70"
              >
                Support Newcastle Digest
              </Link>
              <Link
                href="/"
                className="font-sans-main text-base text-[#251f18]/70 underline underline-offset-2 hover:text-[#849bff]"
              >
                Back to Newcastle Digest
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
