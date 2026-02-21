import { Contact } from '@/components/Contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Newcastle Digest.',
};

export default function Page() {
  return <Contact />;
}
