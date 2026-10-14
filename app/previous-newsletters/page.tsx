import { PreviousNewsletters } from '@/components/PreviousNewsletters';
import type { Metadata } from 'next';
import { listPublicEditions } from '@/lib/beehiiv';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';

export const revalidate = 3600;

const DESCRIPTION =
  'Browse past editions of Newcastle Digest, a weekly email covering events, food, markets, gigs, and local finds.';

export const metadata: Metadata = {
  title: 'Previous Newsletters',
  description: DESCRIPTION,
  alternates: {
    canonical: '/previous-newsletters',
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: 'Previous Newsletters',
    description: DESCRIPTION,
    url: `${SITE_URL}/previous-newsletters`,
  },
};

export default async function Page() {
  const issues = await listPublicEditions();

  return <PreviousNewsletters issues={issues} />;
}
