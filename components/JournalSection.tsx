import Link from 'next/link'
import { JournalCard } from './JournalCard'
import type { JournalPost } from '@/lib/sanity'

export function JournalSection({ posts }: { posts: JournalPost[] }) {
  return (
    <section className="bg-[#faf9f6] px-4 py-16 sm:px-6 md:px-8 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mb-14">
          <h2 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-none text-[#251f18] md:text-5xl lg:text-6xl">
            The Journal
          </h2>
          <Link
            href="/journal"
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] transition-opacity hover:opacity-70"
          >
            Newcastle Digest Journal →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-[24px] border border-[#251f18]/06 bg-white px-8 py-16 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-3">
              Coming soon
            </p>
            <p className="font-sans-main text-lg text-[#251f18]/60">
              Stories and guides from Newcastle will appear here soon.
            </p>
            <Link
              href="/journal"
              className="mt-6 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] transition-opacity hover:opacity-70"
            >
            Visit the Journal →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {posts.map((post) => (
              <JournalCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
