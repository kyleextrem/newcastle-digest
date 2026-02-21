import { WorkWithUs } from '@/components/WorkWithUs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work With Us',
  description: 'Partner with Newcastle Digest — sponsorship and advertising for local brands.',
};

export default function Page() {
  return <WorkWithUs />;
}
