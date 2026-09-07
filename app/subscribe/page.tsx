import { SubscribePage } from '@/components/SubscribePage';
import type { Metadata } from 'next';
import { SITE_URL, OPEN_GRAPH_WEBSITE } from '@/lib/site';

const SUBSCRIBE_TITLE = 'Subscribe | Newcastle Digest: Free Weekly Newsletter for Newcastle, NSW';
const SUBSCRIBE_DESCRIPTION =
  'Join 7,500+ Newcastle locals. Get the best food, events, openings and culture delivered every Wednesday. Free. No spam.';
const SUBSCRIBE_URL = `${SITE_URL}/subscribe`;
const OG_IMAGE_URL = `${SITE_URL}/nd-logo.png`;

export const metadata: Metadata = {
  title: {
    absolute: SUBSCRIBE_TITLE,
  },
  description: SUBSCRIBE_DESCRIPTION,
  alternates: {
    canonical: '/subscribe',
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: SUBSCRIBE_TITLE,
    description: SUBSCRIBE_DESCRIPTION,
    url: SUBSCRIBE_URL,
    images: [{ url: OG_IMAGE_URL }],
  },
};

export default function Page() {
  return <SubscribePage />;
}
