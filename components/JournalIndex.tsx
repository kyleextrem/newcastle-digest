'use client'

import { useState } from 'react'
import Link from 'next/link'
import { JournalCard } from './JournalCard'
import type { JournalPost } from '@/lib/sanity'

const FILTER_PILLS = [
  { label: 'All', slug: 'all' },
  { label: 'Food & Drink', slug: 'food-drink' },
  { label: 'Live Music', slug: 'live-music' },
  { label: 'Events', slug: 'events' },
  { label: 'Guides', slug: 'guides' },
  { label: 'Arts & Culture', slug: 'arts-culture' },
  { label: 'Markets', slug: 'markets' },
]

export function JournalIndex({ posts }: { posts: JournalPost[] }) {
  const [active, setActive] = useState('all')

  const filtered =
    active === 'all'
      ? posts
      : posts.filter((post) => post.category?.slug === active)

  return (
    <section className="bg-[#faf9f6] px-4 py-14 sm:px-6 md:px-8 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <h1 className="mb-4 font-sans-main text-6xl font-black uppercase tracking-tighter leading-none text-[#251f18] md:text-8xl">
            The Journal
          </h1>
          <p className="mx-auto max-w-xl font-sans-main text-lg leading-snug text-[#251f18]/60 md:text-xl">
            Stories, guides and dispatches from Newcastle. For the weekly email,{' '}
            <Link
              href="/previous-newsletters"
              className="text-[#849bff] underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              browse previous editions
            </Link>
            .
          </p>
        </div>

        <div className="-mx-4 mb-12 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide md:mb-16 md:justify-center">
          {FILTER_PILLS.map((pill) => {
            const isActive = active === pill.slug
            return (
              <button
                key={pill.slug}
                type="button"
                onClick={() => setActive(pill.slug)}
                className={`shrink-0 rounded-full px-5 py-2.5 font-mono-main text-[10px] uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'bg-[#849bff] text-white'
                    : 'bg-white text-[#251f18] shadow-sm hover:bg-[#849bff]/10'
                }`}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[24px] bg-white px-8 py-20 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <p className="font-sans-main text-lg text-[#251f18]/60">
              {posts.length === 0
                ? 'No journal posts yet. Check back soon.'
                : 'No posts in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {filtered.map((post) => (
              <JournalCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
