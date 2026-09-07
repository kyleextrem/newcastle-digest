import React from 'react';
import Link from 'next/link';
import type { NewsletterEditionSummary } from '@/lib/beehiiv';
import { formatEditionDate } from '@/lib/beehiiv';

export const PreviousNewsletters: React.FC<{ issues: NewsletterEditionSummary[] }> = ({
  issues,
}) => {
  return (
    <section className="bg-[#faf9f6] min-h-screen py-14 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-16 md:mb-20 text-center">
          <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-3">
            Archive
          </p>
          <h1 className="font-sans-main text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Previous Newsletters
          </h1>
          <p className="font-sans-main text-xl text-[#251f18]/70 max-w-xl mx-auto leading-snug">
            Catch up on past editions of Newcastle Digest. Live music and weekend markets also live in the{' '}
            <Link href="/journal" className="text-[#849bff] underline underline-offset-2 hover:opacity-70">
              Newcastle Digest Journal
            </Link>
            .
          </p>
          <p className="mt-4">
            <Link
              href="/subscribe"
              className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
            >
              Subscribe to the weekly email
            </Link>
          </p>
        </header>

        {issues.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-sans-main text-[#251f18]/60">No past editions yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {issues.map((issue) => (
              <Link
                key={issue.slug || issue.id}
                href={`/previous-newsletters/${issue.slug}`}
                className="group block bg-white rounded-[24px] overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] transition-all duration-300"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#18181e]/8">
                  {issue.thumbnailUrl ? (
                    <img
                      src={issue.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={640}
                      height={360}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[#251f18]/20 font-mono-main text-[10px] uppercase tracking-widest"
                      aria-hidden
                    >
                      No image
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-7">
                  <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] mb-2">
                    {formatEditionDate(issue.publishedAt)}
                  </p>
                  <h2 className="font-sans-main text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-[#251f18] group-hover:text-[#849bff] transition-colors mb-2">
                    {issue.title}
                  </h2>
                  {issue.subtitle && (
                    <p className="font-sans-main text-[#251f18]/60 text-sm leading-snug line-clamp-2">
                      {issue.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
