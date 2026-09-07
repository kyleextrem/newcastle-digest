import { PreviousNewsletters } from '@/components/PreviousNewsletters';
import type { Metadata } from 'next';
import { listPublicEditions } from '@/lib/beehiiv';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Previous Newsletters',
  description: 'Browse past editions of Newcastle Digest, a weekly email covering events, food, markets, gigs, and local finds.',
  alternates: {
    canonical: '/previous-newsletters',
  },
};

export default async function Page() {
  const issues = await listPublicEditions();

  return <PreviousNewsletters issues={issues} />;
}
