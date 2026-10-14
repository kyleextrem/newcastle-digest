import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';
import { ThankYouFlow } from './ThankYouFlow';

const DESCRIPTION = 'Thanks for subscribing to Newcastle Digest.';

export const metadata: Metadata = {
  title: 'Thank You',
  description: DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/thank-you',
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: 'Thank You',
    description: DESCRIPTION,
    url: `${SITE_URL}/thank-you`,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f6]" />}>
      <ThankYouFlow />
    </Suspense>
  );
}
