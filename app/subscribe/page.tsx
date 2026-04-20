import { SubscribePage } from '@/components/SubscribePage';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.newcastledigest.com';
const SUBSCRIBE_URL = `${SITE_URL}/subscribe`;
const OG_IMAGE_URL = `${SITE_URL}/nd-logo.png`;

export const metadata: Metadata = {
  title: 'Subscribe | Newcastle Digest — Free Weekly Newsletter for Newcastle, NSW',
  description: 'Join 7,000+ Newcastle locals. Get the best food, events, openings and culture delivered every Wednesday. Free. No spam.',
  openGraph: {
    title: 'Subscribe | Newcastle Digest — Free Weekly Newsletter for Newcastle, NSW',
    description:
      'Join 7,000+ Newcastle locals. Get the best food, events, openings and culture delivered every Wednesday. Free. No spam.',
    url: SUBSCRIBE_URL,
    images: [{ url: OG_IMAGE_URL }],
  },
};

export default function Page() {
  return <SubscribePage />;
}
