'use client'

import { useState } from 'react'
import { JournalCard } from './JournalCard'
import type { GetawayDestination, JournalPost } from '@/lib/sanity'

export function GetawaysDirectory({
  posts,
  destinations,
}: {
  posts: JournalPost[]
  destinations: GetawayDestination[]
}) {
  const [active, setActive] = useState('all')
  const activeDestination = destinations.find((destination) => destination.slug === active)
  const latest =
    active === 'all' ? posts.slice(1) : posts.filter((post) => post.destination?.slug === active)
  const showBrowse = destinations.length > 0
  const showLatest = latest.length > 0

  if (!showBrowse && !showLatest) return null

  return (
    <section className="px-4 py-4 sm:px-6 md:px-8 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        {showBrowse ? (
          <div className="mb-14 md:mb-16">
            <h2 className="mb-6 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:text-4xl">
              Browse by destination
            </h2>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              <DestinationButton active={active === 'all'} onClick={() => setActive('all')}>
                All
              </DestinationButton>
              {destinations.map((destination) => (
                <DestinationButton
                  key={destination._id}
                  active={active === destination.slug}
                  onClick={() => setActive(destination.slug)}
                >
                  {destination.title}
                </DestinationButton>
              ))}
            </div>
          </div>
        ) : null}

        {showLatest ? (
          <>
            <h2 className="mb-10 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:mb-14 md:text-4xl">
              {activeDestination ? activeDestination.title : 'Latest'}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {latest.map((post) => (
                <JournalCard key={post._id} post={post} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

function DestinationButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-2.5 font-mono-main text-[10px] uppercase tracking-widest transition-colors ${
        active ? 'bg-[#849bff] text-white' : 'bg-white text-[#251f18] shadow-sm hover:bg-[#849bff]/10'
      }`}
    >
      {children}
    </button>
  )
}
