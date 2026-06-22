import { WorkWithUs } from '@/components/WorkWithUs';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.newcastledigest.com';
const WORK_URL = `${SITE_URL}/work`;
const WORK_OG_IMAGE_URL =
  `${SITE_URL}/newcastle/205091-2-09d6d7c1-47e3-48d7-84a4-672f358f231d.png`;

export const metadata: Metadata = {
  title: {
    absolute: 'Partner With Newcastle Digest | Reach 7,000+ Engaged Newcastle Locals',
  },
  description:
    'Advertise with Newcastle Digest — Newcastle\'s fastest-growing local newsletter. Sponsored placements, shoutouts, and event partnerships for local businesses. 60% open rate, 7,000+ subscribers.',
  openGraph: {
    title: 'Partner With Newcastle Digest | Reach 7,000+ Engaged Newcastle Locals',
    description:
      'Advertise with Newcastle Digest — Newcastle\'s fastest-growing local newsletter. Sponsored placements, shoutouts, and event partnerships for local businesses. 60% open rate, 7,000+ subscribers.',
    url: WORK_URL,
    images: [{ url: WORK_OG_IMAGE_URL }],
  },
};

export default function Page() {
  return <WorkWithUs />;
}
