import { JobsPage } from '@/components/JobsPage';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.newcastledigest.com';
const JOBS_URL = `${SITE_URL}/jobs`;
const JOBS_OG_IMAGE_URL =
  `${SITE_URL}/newcastle/205091-2-09d6d7c1-47e3-48d7-84a4-672f358f231d.png`;

export const metadata: Metadata = {
  title: {
    absolute: 'Newcastle Digest Job Board | Reach 7,000+ Local Readers',
  },
  description:
    'Post a job and get seen by Newcastle locals every week. Featured listings reach 7,000+ newsletter readers at 60% open rate. Free, Featured, and Premium tiers. No recruiter fees.',
  openGraph: {
    title: 'Newcastle Digest Job Board | Reach 7,000+ Local Readers',
    description:
      'Post a job and get seen by Newcastle locals every week. Featured listings reach 7,000+ newsletter readers at 60% open rate. Free, Featured, and Premium tiers. No recruiter fees.',
    url: JOBS_URL,
    images: [{ url: JOBS_OG_IMAGE_URL }],
  },
};

export default function Page() {
  return <JobsPage />;
}
