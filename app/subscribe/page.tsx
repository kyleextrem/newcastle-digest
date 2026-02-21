import { SubscribePage } from '@/components/SubscribePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe',
  description: 'Subscribe to Newcastle Digest — one weekly email with the best of Newcastle.',
};

export default function Page() {
  return <SubscribePage />;
}
