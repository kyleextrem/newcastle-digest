export const SITE_URL = 'https://www.newcastledigest.com';
export const SITE_NAME = 'Newcastle Digest';
export const DEFAULT_TITLE = "Newcastle Digest | What's On in Newcastle NSW";
export const DEFAULT_DESCRIPTION =
  "Newcastle Digest is Newcastle's independent weekly guide to what's happening across Newcastle, NSW, covering events, food, live music, sport, culture, history and local stories.";
export const DEFAULT_OG_IMAGE = '/nd-logo.png';
export const INSTAGRAM_URL = 'https://www.instagram.com/newcastledigest/';

export const OPEN_GRAPH_WEBSITE = {
  type: 'website' as const,
  locale: 'en_AU',
  siteName: SITE_NAME,
};

export const newsMediaOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description: DEFAULT_DESCRIPTION,
  areaServed: 'Newcastle, NSW, Australia',
  sameAs: [INSTAGRAM_URL],
};
