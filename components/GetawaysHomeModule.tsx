import Link from 'next/link'
import { JournalCard } from './JournalCard'
import type { JournalPost } from '@/lib/sanity'

export function GetawaysHomeModule({ post }: { post: JournalPost | null }) {
  return (
    <section className="border-t border-[#251f18]/06 bg-[#faf9f6] px-4 py-14 sm:px-6 md:px-8 md:py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div>
            <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
              Getaways
            </p>
            <h2 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.9] text-[#251f18] md:text-5xl">
              Need to get out of Newcastle?
            </h2>
            <p className="mt-4 max-w-md font-sans-main text-lg leading-relaxed text-[#251f18]/60">
              Places worth escaping to from Newcastle.
            </p>
            <Link
              href="/getaways"
              className="mt-6 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] transition-opacity hover:opacity-70"
            >
              See all getaways →
            </Link>
          </div>
          {post ? (
            <JournalCard post={post} />
          ) : (
            <p className="font-sans-main text-lg text-[#251f18]/50">New getaways will appear here.</p>
          )}
        </div>
      </div>
    </section>
  )
}
