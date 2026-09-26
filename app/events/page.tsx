import type { Metadata } from 'next';
import { EventsPage } from '@/components/EventsPage';
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site';

const EVENTS_URL = `${SITE_URL}/events`;
const TITLE = "What's On in Newcastle NSW | Newcastle Digest";
const DESCRIPTION =
  "What's on in Newcastle, all in one place. The Newcastle Digest Events Directory is a guide to Newcastle events and things to do in Newcastle NSW, from live music and markets to sport, culture and community events.";
const OG_IMAGE = `${SITE_URL}/newcastle/205005-2-379ef717-0a0e-41b2-b8d1-25dce36cc346.png`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/events' },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: TITLE,
    description: DESCRIPTION,
    url: EVENTS_URL,
    images: [{ url: OG_IMAGE }],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return <EventsPage />;
}
