import { PreviousNewsletters } from '@/components/PreviousNewsletters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Previous Newsletters',
  description: 'Browse past editions of Newcastle Digest — a weekly email covering events, food, markets, gigs, and local finds.',
};

export default function Page() {
  return <PreviousNewsletters />;
}
