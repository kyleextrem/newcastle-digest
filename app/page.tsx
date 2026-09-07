import { HomePage } from '@/components/HomePage';
import type { Metadata } from 'next';
import { getRecentPosts } from '@/lib/sanity';
import { SITE_URL, OPEN_GRAPH_WEBSITE } from '@/lib/site';

export const revalidate = 3600;

const HOME_URL = SITE_URL;
const OG_IMAGE_URL = `${HOME_URL}/nd-logo.png`;
const HOME_TITLE = "Newcastle Digest | What's On in Newcastle NSW Every Week";
const HOME_DESCRIPTION =
  "What's on in Newcastle NSW this week? Newcastle Digest is the independent weekly guide covering events, live music, food, sport, culture, history and things to do around Newcastle.";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: HOME_URL,
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: HOME_URL,
    images: [{ url: OG_IMAGE_URL }],
  },
  twitter: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

export default async function Page() {
  const journalPosts = await getRecentPosts();

  return <HomePage journalPosts={journalPosts} />;
}
