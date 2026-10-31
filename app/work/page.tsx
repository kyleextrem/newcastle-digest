import { WorkWithUs } from '@/components/WorkWithUs';
import type { Metadata } from 'next';
import { SITE_URL, OPEN_GRAPH_WEBSITE } from '@/lib/site';

const WORK_URL = `${SITE_URL}/work`;
const WORK_OG_IMAGE_URL =
  `${SITE_URL}/newcastle/205091-2-09d6d7c1-47e3-48d7-84a4-672f358f231d.png`;

export const metadata: Metadata = {
  title: {
    absolute: 'Reach more people in Newcastle | Newcastle Digest',
  },
  description:
    'Put your business in front of locals who read Newcastle Digest every week. Newsletter features, sponsored articles and ongoing advertising.',
  alternates: {
    canonical: '/work',
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: 'Reach more people in Newcastle | Newcastle Digest',
    description:
      'Put your business in front of locals who read Newcastle Digest every week. Newsletter features, sponsored articles and ongoing advertising.',
    url: WORK_URL,
    images: [{ url: WORK_OG_IMAGE_URL }],
  },
  twitter: {
    images: [WORK_OG_IMAGE_URL],
  },
};

export default function Page() {
  return <WorkWithUs />;
}
