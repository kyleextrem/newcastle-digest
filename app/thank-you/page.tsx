import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ThankYouFlow } from './ThankYouFlow';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Thanks for subscribing to Newcastle Digest.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f6]" />}>
      <ThankYouFlow />
    </Suspense>
  );
}
