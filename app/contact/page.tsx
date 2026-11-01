import { Contact } from '@/components/Contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Newcastle Digest.',
  alternates: {
    canonical: '/contact',
  },
};

export default function Page() {
  return <Contact />;
}
