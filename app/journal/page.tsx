import type { Metadata } from 'next'
import { JournalIndex } from '@/components/JournalIndex'
import { getPosts } from '@/lib/sanity'
import { OPEN_GRAPH_WEBSITE, SITE_URL } from '@/lib/site'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Journal',
  description: 'Stories, guides and dispatches from Newcastle.',
  alternates: {
    canonical: '/journal',
  },
  openGraph: {
    ...OPEN_GRAPH_WEBSITE,
    title: 'The Journal',
    description: 'Stories, guides and dispatches from Newcastle.',
    url: `${SITE_URL}/journal`,
  },
}

export default async function JournalPage() {
  const posts = await getPosts()

  return <JournalIndex posts={posts} />
}
