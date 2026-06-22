import { HomePage } from '@/components/HomePage';
import type { Metadata } from 'next';

const HOME_URL = 'https://www.newcastledigest.com';
const OG_IMAGE_URL = `${HOME_URL}/nd-logo.png`;
const HOME_DESCRIPTION =
  'Newcastle Digest is a free weekly newsletter read by 7,000+ locals. Food, events, openings and culture — curated and delivered every Wednesday.';

export const metadata: Metadata = {
  title: 'Newcastle Digest | The best of Newcastle',
  description: HOME_DESCRIPTION,
  openGraph: {
    title: 'Newcastle Digest | The best of Newcastle',
    description: HOME_DESCRIPTION,
    url: HOME_URL,
    images: [{ url: OG_IMAGE_URL }],
  },
};

const newsMediaOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Newcastle Digest',
  url: HOME_URL,
  description: HOME_DESCRIPTION,
  areaServed: 'Newcastle, NSW, Australia',
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsMediaOrganizationJsonLd) }}
      />
      <HomePage />
    </>
  );
}
