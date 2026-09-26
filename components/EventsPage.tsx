import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const DIRECTORY_URL = 'https://events.newcastledigest.com';
const SUBMIT_URL = 'https://events.newcastledigest.com/submit';
const FEATURE_URL = 'https://events.newcastledigest.com/feature';

const CATEGORIES = [
  {
    title: 'Live Music',
    description: 'Gigs, concerts and live music across Newcastle.',
    href: 'https://events.newcastledigest.com/categories/live-music',
  },
  {
    title: 'Markets',
    description: 'Markets and makers around Newcastle.',
    href: 'https://events.newcastledigest.com/categories/markets',
  },
  {
    title: 'Festivals',
    description: 'Festivals and major events.',
    href: 'https://events.newcastledigest.com/categories/festivals',
  },
  {
    title: 'Sport',
    description: 'Sport and active events.',
    href: 'https://events.newcastledigest.com/categories/sport',
  },
  {
    title: 'Culture',
    description: 'Arts, culture and exhibitions.',
    href: 'https://events.newcastledigest.com/categories/culture',
  },
  {
    title: 'Things to Do',
    description: 'Other things to do in Newcastle.',
    href: 'https://events.newcastledigest.com/categories/things-to-do',
  },
];

const FEATURED_POINTS = [
  'A Featured badge and featured treatment in the Events Directory',
  'Placement on the Featured Events page',
  'A promotional image',
  'Promotional copy',
  'A link to tickets, booking, or more information',
  'Featured placement in the Newcastle Digest weekly newsletter while the listing is active',
];

export const EventsPage: React.FC = () => {
  return (
    <div className="bg-[#faf9f6]">
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-[#faf9f6]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(132,155,255,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.06),transparent_45%)]" />

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="inline-block h-px w-12 bg-[#849bff]/40 mb-8" aria-hidden />
            <p className="font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#251f18]/50 mb-6">
              Newcastle Digest Events
            </p>
            <h1 className="font-sans-main font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.88] text-[#251f18]">
              What&apos;s On in Newcastle,{' '}
              <span className="text-[#849bff]">all in one place.</span>
            </h1>
            <p className="font-sans-main text-lg md:text-xl text-[#251f18]/60 mt-8 max-w-2xl leading-relaxed">
              The Newcastle Digest Events Directory is a growing guide to things happening across Newcastle and the surrounding region. Live music, markets, exhibitions, workshops, festivals, sport, theatre, community events, and other reasons to get out of the house.
            </p>
            <a
              href={DIRECTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 bg-[#849bff] text-white px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#251f18] transition-all"
            >
              Browse what&apos;s on <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="rounded-[32px] overflow-hidden aspect-[4/3] bg-[#f5f4f0]">
            <img
              src="/newcastle/205005-2-379ef717-0a0e-41b2-b8d1-25dce36cc346.png"
              alt="Newcastle"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              The directory
            </p>
            <h2 className="font-sans-main font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18]">
              A Newcastle event guide you can actually look through.
            </h2>
            <p className="font-sans-main text-lg text-[#251f18]/60 mt-6 leading-relaxed">
              The Wednesday email is still the weekly read. The directory is where you go when you want to see what&apos;s on in Newcastle: tonight, this weekend, or further out. It covers events in Newcastle NSW, from a gig at the baths to a Sunday market.
            </p>
            <p className="font-sans-main text-lg text-[#251f18]/60 mt-4 leading-relaxed">
              You can browse the full list, the calendar by date, categories by type, and venues by place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-3">
              <a
                href="https://events.newcastledigest.com/events/calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
              >
                Calendar →
              </a>
              <a
                href="https://events.newcastledigest.com/categories"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
              >
                Categories →
              </a>
              <a
                href="https://events.newcastledigest.com/venues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
              >
                Venues →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 pb-16 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
            Explore what&apos;s on
          </p>
          <h2 className="font-sans-main font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18] max-w-3xl">
            Things to do in Newcastle, sorted the way you&apos;d look for them.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-10 md:mt-14">
            {CATEGORIES.map((category) => (
              <a
                key={category.href}
                href={category.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[28px] bg-white p-8 md:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.01]"
              >
                <h3 className="font-sans-main font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#251f18] group-hover:text-[#849bff] transition-colors">
                  {category.title}
                </h3>
                <p className="font-sans-main text-base text-[#251f18]/55 mt-3 leading-relaxed">
                  {category.description}
                </p>
                <span className="inline-flex items-center gap-2 mt-6 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
                  Browse <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-24 bg-[#f5f4f0]">
        <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              For organisers
            </p>
            <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9] text-[#251f18]">
              Got an event coming up?
            </h2>
            <p className="font-sans-main text-lg text-[#251f18]/60 mt-6 leading-relaxed">
              Event organisers can submit an event to the Newcastle Digest Events Directory for free. Submissions are reviewed before publication. Once an event is approved, it appears in the public directory.
            </p>
            <a
              href={SUBMIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 bg-[#251f18] text-white px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#849bff] transition-all"
            >
              Submit an event <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="rounded-[32px] overflow-hidden aspect-[4/3] bg-[#faf9f6]">
            <img
              src="/newcastle/204739-2-9f6c79cb-503b-4e6c-abf0-1c01ee1b1ff2.png"
              alt="Kayaks at Nobbys"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-[32px] md:rounded-[40px] bg-[#18181e] text-white p-8 sm:p-10 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.2),transparent_50%)] pointer-events-none" />
            <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-10 lg:gap-16">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
                  Featured Event Listing
                </p>
                <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9]">
                  Want more people to see it?
                </h2>
                <p className="font-sans-main text-lg text-white/70 mt-6 leading-relaxed max-w-xl">
                  A Featured listing is $49 AUD. The event is still reviewed before it is published. If it is approved, the featured listing runs from approval until the event finishes.
                </p>
                <ul className="mt-8 space-y-3">
                  {FEATURED_POINTS.map((point) => (
                    <li key={point} className="font-sans-main text-base text-white/80 leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="font-sans-main text-sm text-white/45 mt-8 leading-relaxed max-w-xl">
                  Featured does not guarantee approval or publication.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-[28px] bg-[#222228] p-8 md:p-10">
                <div>
                  <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
                    $49 AUD
                  </p>
                  <p className="font-sans-main font-black text-3xl uppercase tracking-tighter mt-4 leading-none">
                    Until the event finishes
                  </p>
                  <p className="font-sans-main text-white/55 mt-4 leading-relaxed">
                    From approval through to the end of the event. Featured treatment in the directory, plus featured placement in the weekly newsletter for that same run.
                  </p>
                </div>
                <a
                  href={FEATURE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 inline-flex items-center justify-center gap-2 bg-[#849bff] text-white px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#18181e] transition-all"
                >
                  Get your event featured <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-24 bg-[#f5f4f0]">
        <div className="container mx-auto max-w-3xl">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
            Wednesday chronicles
          </p>
          <h2 className="font-sans-main font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18]">
            The directory finds what&apos;s on. The email brings Newcastle to you.
          </h2>
          <p className="font-sans-main text-lg text-[#251f18]/60 mt-6 leading-relaxed">
            Newcastle Digest is read by 7,500+ locals. Every Wednesday, the newsletter carries the best of the city: events, food, live music, sport, culture, and the other things worth knowing about.
          </p>
          <p className="font-sans-main text-lg text-[#251f18]/60 mt-4 leading-relaxed">
            The Events Directory helps locals discover what&apos;s happening. The weekly Newcastle Digest newsletter brings the best of Newcastle directly to subscribers every Wednesday.
          </p>
          <Link
            href="/subscribe"
            className="mt-8 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
          >
            Get the Wednesday email →
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <a
            href={DIRECTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full rounded-[32px] md:rounded-[40px] bg-[#251f18] text-white p-10 md:p-14 relative overflow-hidden transition-transform hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.2),transparent_50%)] pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-4">
                  Newcastle Digest Events
                </p>
                <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9]">
                  See what&apos;s on in Newcastle.
                </h2>
                <p className="font-sans-main text-white/60 mt-4 text-base md:text-lg max-w-xl">
                  Markets, gigs, sport, culture and the rest of the week, in one directory.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all self-start md:self-auto">
                Browse what&apos;s on <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
};
