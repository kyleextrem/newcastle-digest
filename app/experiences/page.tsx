import { Experiences } from '@/components/Experiences';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Experiences',
  description: 'Experiences and guides from Newcastle Digest.',
  alternates: {
    canonical: '/experiences',
  },
};

export default function Page() {
  return <Experiences />;
}
