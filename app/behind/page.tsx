import { BehindTheDigest } from '@/components/BehindTheDigest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Behind the Digest',
  description: 'Learn about Newcastle Digest and how we curate the best of Newcastle.',
};

export default function Page() {
  return <BehindTheDigest />;
}
