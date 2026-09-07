import type { Metadata } from 'next'
import { JournalIndex } from '@/components/JournalIndex'
import { getPosts } from '@/lib/sanity'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Journal',
  description: 'Stories, guides and dispatches from Newcastle.',
  alternates: {
    canonical: '/journal',
  },
}

export default async function JournalPage() {
  const posts = await getPosts()

  return <JournalIndex posts={posts} />
}
