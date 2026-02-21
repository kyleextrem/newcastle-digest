import { PrivacyCopyright } from '@/components/PrivacyCopyright';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & Terms',
  description: 'Privacy policy and terms of use for Newcastle Digest.',
};

export default function Page() {
  return <PrivacyCopyright />;
}
