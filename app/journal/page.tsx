import { StoriesGrid } from '@/components/StoriesGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Journal',
  description: 'Stories and guides from Newcastle Digest.',
};

export default function Page() {
  return <StoriesGrid />;
}
