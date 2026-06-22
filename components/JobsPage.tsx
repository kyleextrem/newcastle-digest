import React from 'react';
import { ExternalLink } from 'lucide-react';
import { JobsFAQ } from './JobsFAQ';

const JOBS_SUBMIT_URL = 'https://jobs.newcastledigest.com/jobs/submit';
const JOBS_BROWSE_URL = 'https://jobs.newcastledigest.com/jobs';

type PricingTier = {
  id: string;
  title: string;
  price: string;
  desc: string;
  light?: boolean;
};

const WHY_CARDS = [
  {
    eyebrow: 'Newsletter reach',
    title: 'Real local reach',
    desc: 'Featured listings go straight into the Newcastle Digest newsletter, read by 7,000+ locals at 60% open rate.',
    dark: true,
  },
  {
    eyebrow: 'Local only',
    title: 'Built for Newcastle',
    desc: 'Every listing is local — no noise from interstate or remote roles cluttering your search.',
    dark: false,
  },
  {
    eyebrow: 'No surprises',
    title: 'Simple, fair pricing',
    desc: 'No recruiter fees, no bidding wars. Flat pricing that makes sense for small businesses and growing teams.',
    dark: true,
  },
];

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    title: 'Free',
    price: '$0',
    desc: 'A basic listing on the job board. Perfect for testing the waters or filling a casual role.',
  },
  {
    id: 'featured',
    title: 'Featured',
    price: '$99',
    desc: 'Newsletter mention plus 7 days of top placement on the board.',
    light: true,
  },
  {
    id: 'premium',
    title: 'Premium',
    price: '$149',
    desc: 'Newsletter mention, 14 days top placement, and a dedicated Instagram post to our audience.',
  },
];

export const JobsPage: React.FC = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full min-h-[70vh] md:min-h-[75vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#faf9f6]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(132,155,255,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.06),transparent_45%)]" />
        <div className="absolute top-1/2 right-0 w-[60vw] max-w-[700px] h-[70vw] max-h-[700px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[#849bff]/[0.04] blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <div className="w-full max-w-4xl mx-auto">
              <div className="inline-block h-px w-12 bg-[#849bff]/40 mb-8" aria-hidden />
              <p className="font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#251f18]/50 mb-6">
                Newcastle Digest Job Board
              </p>
              <h1 className="font-sans-main font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.85] text-[#251f18]">
                Newcastle&apos;s job board,{' '}
                <span className="text-[#849bff]">backed by 7,000+ local readers</span>
              </h1>
              <p className="font-serif-alt italic text-lg md:text-xl text-[#251f18]/55 mt-8 max-w-2xl mx-auto leading-relaxed">
                Post a role and get seen by Newcastle locals every week — not lost in a sea of national listings.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <a
                  href={JOBS_SUBMIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#849bff] text-white px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#251f18] transition-all"
                >
                  Post a Job <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={JOBS_BROWSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#251f18]/20 text-[#251f18] px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#251f18] hover:text-white transition-all"
                >
                  Browse Jobs <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why this beats Seek/Indeed */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              Why post here
            </p>
            <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9] text-[#251f18]">
              Not another national job board.
            </h2>
            <p className="font-serif-alt italic text-lg md:text-xl text-[#251f18]/55 mt-4 max-w-2xl mx-auto">
              Thoughtfully built for Newcastle employers who want real local reach — not a pay-to-play auction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className={`rounded-[32px] md:rounded-[40px] p-10 md:p-12 min-h-[300px] flex flex-col relative transition-transform hover:scale-[1.01] ${
                  card.dark
                    ? 'bg-[#18181e] text-white'
                    : 'bg-[#f5f4f0] text-[#251f18] border border-[#251f18]/06'
                }`}
              >
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    card.dark
                      ? 'bg-gradient-to-t from-[#849bff]/25 via-transparent to-transparent'
                      : 'bg-gradient-to-t from-[#849bff]/08 via-transparent to-transparent'
                  }`}
                />
                <div className="relative h-full flex flex-col">
                  <p
                    className={`font-mono-main text-[10px] uppercase tracking-[0.25em] mb-6 ${
                      card.dark ? 'text-[#849bff]' : 'text-[#e07a5f]'
                    }`}
                  >
                    {card.eyebrow}
                  </p>
                  <h3 className="font-sans-main font-black text-3xl md:text-4xl uppercase tracking-tighter leading-[0.9] mt-auto">
                    {card.title}
                  </h3>
                  <p
                    className={`font-serif-alt italic mt-4 text-base md:text-lg ${
                      card.dark ? 'text-white/60' : 'text-[#251f18]/55'
                    }`}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative bg-[#18181e] text-white py-16 md:py-24 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(132,155,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              Pricing
            </p>
            <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9]">
              Straightforward tiers.
            </h2>
            <p className="font-serif-alt italic text-lg md:text-xl text-white/50 mt-4 max-w-2xl mx-auto">
              Start free, upgrade when you want more reach. No hidden fees, no recruiter commissions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative p-10 md:p-12 rounded-[40px] flex flex-col justify-between min-h-[380px] transition-all duration-300 hover:scale-[1.02] ${
                  tier.light
                    ? 'bg-[#849bff] text-white'
                    : 'bg-[#222228] text-white border border-white/5'
                }`}
              >
                <div>
                  <p
                    className={`font-mono-main text-[10px] uppercase tracking-widest mb-6 ${
                      tier.light ? 'text-white/80' : 'opacity-40'
                    }`}
                  >
                    {tier.price}
                  </p>
                  <h3 className="font-sans-main text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                    {tier.title}
                  </h3>
                  <p
                    className={`font-serif-alt italic text-lg md:text-xl ${
                      tier.light ? 'text-white/80' : 'text-white/40'
                    }`}
                  >
                    {tier.desc}
                  </p>
                </div>
                <a
                  href={JOBS_SUBMIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-10 w-full py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest border transition-all text-center block ${
                    tier.light
                      ? 'bg-white text-[#849bff] border-white hover:bg-[#faf9f6]'
                      : 'border-white/20 hover:bg-white hover:text-[#251f18]'
                  }`}
                >
                  Post a Job →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-[#f5f4f0]">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 md:mb-14">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              Common questions
            </p>
            <h2 className="font-sans-main font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18]">
              FAQ
            </h2>
          </div>
          <JobsFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <a
            href={JOBS_SUBMIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full rounded-[32px] md:rounded-[40px] overflow-hidden bg-[#251f18] text-white p-10 md:p-14 relative transition-transform hover:scale-[1.01] text-left"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.2),transparent_50%)] pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-4">
                  Newcastle Digest Job Board
                </p>
                <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9]">
                  Ready to find your next great hire?
                </h2>
                <p className="font-serif-alt italic text-white/60 mt-4 text-base md:text-lg max-w-xl">
                  Post your role today and reach thousands of engaged Newcastle locals — thoughtfully, not algorithmically.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all self-start md:self-auto">
                Post a Job <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        </div>
      </section>
    </>
  );
};
