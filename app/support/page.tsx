import type { Metadata } from 'next';
import { SupportForm } from '@/components/SupportForm';
import { parseContributionAmount } from '@/lib/support-contribution';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';

const SUPPORT_TITLE = 'Support Newcastle Digest | Newcastle Digest';
const SUPPORT_DESCRIPTION =
  'Support Newcastle Digest and help keep our independent weekly guide to Newcastle running and growing.';

export const metadata: Metadata = {
  title: { absolute: SUPPORT_TITLE },
  description: SUPPORT_DESCRIPTION,
  alternates: {
    canonical: '/support',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: SUPPORT_TITLE,
    description: SUPPORT_DESCRIPTION,
    url: `${SITE_URL}/support`,
  },
};

type PageProps = {
  searchParams: Promise<{ amount?: string }>;
};

export default async function SupportPage({ searchParams }: PageProps) {
  const { amount } = await searchParams;
  const parsed = amount ? parseContributionAmount(amount) : null;
  const initialAmount = parsed?.ok ? parsed.amount : '10.00';

  return (
    <section className="bg-[#faf9f6] px-4 py-16 sm:px-6 md:px-8 md:py-28">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
          Support Newcastle Digest
        </p>
        <h1 className="mb-6 font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl md:text-6xl">
          Help keep Newcastle Digest going.
        </h1>
        <p className="mb-12 font-sans-main text-lg leading-relaxed text-[#251f18]/80 md:text-xl">
          Newcastle Digest is independently built alongside a full-time job. If you enjoy the newsletter and want to contribute towards the costs of keeping it running, you can chip in whatever feels right.
        </p>
        <SupportForm initialAmount={initialAmount} />
      </div>
    </section>
  );
}
