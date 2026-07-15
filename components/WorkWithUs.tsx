
import React from 'react';

type Tier = {
  id: string;
  title: string;
  desc: string;
  price: string;
  color: string;
  light?: boolean;
  foundersChoice?: boolean;
};

const TALLY_INQUIRE_URL = 'https://tally.so/r/wkK8xj';
const DIGEST_STUDIO_URL = 'https://digeststudio.com.au/';
const CAL_URL = 'https://cal.com/digest';

const tiers: Tier[] = [
  { 
    id: 'standard', 
    title: "Single Placement", 
    desc: "A one-off spot in our Wednesday edition. Perfect for announcements.", 
    price: "Standard",
    color: "#251f18"
  },
  { 
    id: 'premium', 
    title: "Featured Event", 
    desc: "Top billing for your festival, gig, or grand opening.", 
    price: "Premium",
    color: "#251f18"
  },
  { 
    id: 'growth', 
    title: "Launch Package", 
    desc: "For new businesses. 4 weeks of consistent exposure + social boost.", 
    price: "Growth",
    color: "#849bff",
    light: true
  },
  { 
    id: 'ongoing', 
    title: "Quarterly Partner", 
    desc: "12 editions of deep integration and audience trust-building.", 
    price: "Ongoing",
    color: "#251f18"
  },
  { 
    id: 'strategic', 
    title: "Yearly Anchor", 
    desc: "Become part of the Newcastle furniture. Maximum visibility.", 
    price: "Strategic",
    color: "#251f18"
  },
  { 
    id: 'bespoke', 
    title: "Custom Activation", 
    desc: "Have an idea? Let's build a bespoke campaign together.", 
    price: "Bespoke",
    color: "#251f18"
  },
  { 
    id: 'partner', 
    title: "Digest Studio+", 
    desc: "Full marketing support. Strategy, creative, and media access through Kyle.", 
    price: "Partner",
    color: "#849bff",
    light: true,
    foundersChoice: true
  }
];

export const WorkWithUs: React.FC = () => {
  return (
    <section className="relative bg-[#18181e] text-white min-h-screen py-24 px-4 md:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(132,155,255,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(132,155,255,0.08),transparent_50%)] pointer-events-none" />
      <div className="container mx-auto relative z-10">
        {/* Hero */}
        <div className="bg-[#0a0f1e] rounded-[40px] px-8 md:px-16 py-16 md:py-24 mb-16">
          <h1 className="font-sans-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight max-w-4xl">
            Newcastle Digest reaches 7,000+ locals every Wednesday morning.
          </h1>
          <p className="font-serif-alt italic text-xl md:text-2xl text-white/70 mt-6 max-w-3xl">
            We don&apos;t sell ad space. We tell our readers what&apos;s worth their time — and sometimes that&apos;s your business.
          </p>

          {/* Stat strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-14 pt-10 border-t border-white/10">
            <div>
              <p className="font-sans-display text-3xl md:text-4xl font-bold text-[#a78bfa]">7,000+</p>
              <p className="font-mono-main text-[10px] uppercase tracking-widest text-white/50 mt-2">Subscribers</p>
            </div>
            <div>
              <p className="font-sans-display text-3xl md:text-4xl font-bold text-[#a78bfa]">60%</p>
              <p className="font-mono-main text-[10px] uppercase tracking-widest text-white/50 mt-2">Open Rate</p>
            </div>
            <div>
              <p className="font-sans-display text-3xl md:text-4xl font-bold text-[#a78bfa]">10–12%</p>
              <p className="font-mono-main text-[10px] uppercase tracking-widest text-white/50 mt-2">Click-through</p>
            </div>
            <div>
              <p className="font-sans-display text-3xl md:text-4xl font-bold text-[#a78bfa]">Wed AM</p>
              <p className="font-mono-main text-[10px] uppercase tracking-widest text-white/50 mt-2">Inbox delivery</p>
            </div>
          </div>
        </div>

        {/* Why this works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="space-y-4">
            <h3 className="font-sans-main text-2xl font-bold text-white">Trust beats an ad</h3>
            <p className="font-serif-alt italic text-lg text-white/60 leading-relaxed">
              A caption you paid for gets two seconds of attention before someone scrolls past. A feature in Newcastle Digest sits in an inbox until it&apos;s actually read, because people signed up wanting to know what&apos;s happening locally, not to see an ad.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-sans-main text-2xl font-bold text-white">Who this works for</h3>
            <p className="font-serif-alt italic text-lg text-white/60 leading-relaxed">
              New openings that need a launch crowd. Events that need bums on seats. Local businesses that want to stay in front of people who already care what&apos;s happening in this city.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-sans-main text-2xl font-bold text-white">Not an ad network</h3>
            <p className="font-serif-alt italic text-lg text-white/60 leading-relaxed">
              We&apos;re a local voice 7,000 people chose to let into their inbox. When we mention a business, it reads like a recommendation, because that&apos;s what it is.
            </p>
          </div>
        </div>

        {/* Choose your placement */}
        <div id="pricing" className="mb-16">
          <h2 className="font-sans-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-10">
            Choose your placement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Featured Event */}
            <div className="bg-[#0a0f1e] rounded-[32px] p-8 flex flex-col justify-between border border-white/5">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#a78bfa] mb-4">$150 / one-off</p>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Featured Event</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  A quick mention for something time-bound — an opening, a market, a one-night event.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>40–60 word listing-style mention</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Runs in a grouped &ldquo;What&apos;s On&rdquo; style callout</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Uses your own event flyer or image</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Inline link, no dedicated CTA button</li>
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/fZu4gA0v32sze0Ma98afS03"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white transition-all"
              >
                Buy now
              </a>
            </div>

            {/* Card 2: Single Placement */}
            <div className="bg-[#0a0f1e] rounded-[32px] p-8 flex flex-col justify-between border border-white/5">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#a78bfa] mb-4">$250 / one-off</p>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Single Placement</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  A one-off sponsored feature inside one Wednesday edition, written in our voice.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>80–120 words custom-written copy</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Header image supplied or sourced by us</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Your logo + &ldquo;Brought to you by [Business]&rdquo; branding</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>CTA button with your link</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Delivered to 7,000+ subscribers</li>
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/bJecN62Db3wD8Gs3KKafS02"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white transition-all"
              >
                Buy now
              </a>
            </div>

            {/* Card 3: Launch Package */}
            <div className="bg-[#0a0f1e] rounded-[32px] p-8 flex flex-col justify-between border border-white/5">
              <div>
                <span className="inline-block font-mono-main text-[9px] uppercase tracking-widest text-white/90 px-3 py-1 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] mb-3">
                  Best for launches
                </span>
                <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#a78bfa] mb-4">$600 / 4 weeks</p>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Launch Package</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  Everything a new business needs for a proper local launch — feature ad, ongoing presence, and social reach, bundled together.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>1x Feature Ad</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Supporter callout across 4–5 editions</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>1x Instagram post (Social Media+ included)</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Priority scheduling</li>
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/fZueVe3Hf6IP4qcepoafS01"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white transition-all"
              >
                Buy now
              </a>
            </div>

            {/* Card 4: Monthly Partner */}
            <div className="bg-[#0a0f1e] rounded-[32px] p-8 flex flex-col justify-between border border-white/5">
              <div>
                <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#a78bfa] mb-4">$500 / month</p>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Monthly Partner</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  A month of consistent presence — one feature plus your name in front of readers every week.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>1x Feature Ad, your choice of edition</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Supporter callout in every edition that month (4–5 editions)</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Priority scheduling</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Social Media+ available as add-on ($200/mo)</li>
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/aFa7sMb9H4AHbSE1CCafS04"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white transition-all"
              >
                Buy now
              </a>
            </div>
          </div>
        </div>

        {/* For ongoing partners */}
        <div className="mb-16">
          <h2 className="font-sans-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-10">
            For ongoing partners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Quarterly Partner */}
            <div className="bg-[#a78bfa]/10 rounded-[32px] p-8 flex flex-col justify-between border border-[#a78bfa]/20">
              <div>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Quarterly Partner</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  Three months of deep integration. A feature every month, your name in every edition across the quarter, and a report showing exactly what it delivered.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>3x Feature Ads, one per month</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Supporter callout in every edition across the quarter (12–13 editions)</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Priority scheduling across the full quarter</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>End of quarter performance report</li>
                </ul>
              </div>
              {/* TODO: Replace with Cal.com link for Quarterly Partner */}
              <a
                href="#"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest bg-[#a78bfa] text-white hover:bg-[#a78bfa]/80 transition-all"
              >
                Book a call
              </a>
            </div>

            {/* Card 2: Yearly Anchor */}
            <div className="bg-[#a78bfa]/10 rounded-[32px] p-8 flex flex-col justify-between border border-[#a78bfa]/20">
              <div>
                <span className="inline-block font-mono-main text-[9px] uppercase tracking-widest px-3 py-1 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] mb-3">
                  Flagship
                </span>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Yearly Anchor</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  One business per category, locked in for the year.
                </p>
                <ul className="space-y-2 text-sm text-white/50 font-sans-main">
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>12x Feature Ads, one per month</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Supporter callout in every edition, all year</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>12x native Instagram posts</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>One editorial feature — a proper written piece in the main newsletter body</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Quarterly performance reports</li>
                  <li className="flex items-start gap-2"><span className="text-[#a78bfa] mt-0.5">•</span>Category exclusivity — no competitor in your category while you hold the spot</li>
                </ul>
              </div>
              {/* TODO: Replace with Cal.com link for Yearly Anchor */}
              <a
                href="#"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest bg-[#a78bfa] text-white hover:bg-[#a78bfa]/80 transition-all"
              >
                Book a call
              </a>
            </div>

            {/* Card 3: Custom Engagement */}
            <div className="bg-[#a78bfa]/10 rounded-[32px] p-8 flex flex-col justify-between border border-[#a78bfa]/20">
              <div>
                <h3 className="font-sans-display text-2xl font-bold text-white mb-3">Custom Engagement</h3>
                <p className="font-serif-alt italic text-base text-white/60 mb-6">
                  Got something bigger in mind? A sponsored dinner series, a launch across every channel we run, a combination of newsletter, events, and Digest Studio? Tell us what you&apos;re building and we&apos;ll put a plan together.
                </p>
              </div>
              {/* TODO: Replace with Cal.com link for Custom Engagement */}
              <a
                href="#"
                className="mt-8 block w-full text-center py-3 rounded-full font-mono-main text-[10px] uppercase tracking-widest bg-[#a78bfa] text-white hover:bg-[#a78bfa]/80 transition-all"
              >
                Book a call
              </a>
            </div>
          </div>
        </div>

        {/* Beyond the newsletter */}
        <div className="mb-16 border-t border-white/10 pt-16">
          <div className="max-w-3xl">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#a78bfa] mb-4">Digest Studio</p>
            <h2 className="font-sans-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Beyond the newsletter
            </h2>
            <p className="font-serif-alt italic text-xl md:text-2xl text-white/60 leading-relaxed mb-10">
              Sponsorship gets your business seen by 7,000 locals. Digest Studio builds what happens after they click — a site, content, or SEO built to actually convert. Same team, same understanding of this market, different job.
            </p>
            <a
              href="https://digeststudio.com.au/services"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-full font-sans-main font-bold text-sm uppercase tracking-widest bg-white text-[#18181e] hover:bg-white/90 transition-all"
            >
              See what Digest Studio builds
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="font-sans-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
            How it works
          </h2>
          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            <details className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-sans-main text-base md:text-lg text-white/80 font-medium">
                <span>Supply your assets, we write the copy</span>
                <span className="text-[#a78bfa] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="font-serif-alt italic text-base text-white/50 mt-3 leading-relaxed max-w-3xl">
                You supply your logo, image, offer and link. We write the copy in our voice. No briefs, no back and forth.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-sans-main text-base md:text-lg text-white/80 font-medium">
                <span>Lead time</span>
                <span className="text-[#a78bfa] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="font-serif-alt italic text-base text-white/50 mt-3 leading-relaxed max-w-3xl">
                7 days minimum lead time for a Feature Ad.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-sans-main text-base md:text-lg text-white/80 font-medium">
                <span>Billing periods</span>
                <span className="text-[#a78bfa] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="font-serif-alt italic text-base text-white/50 mt-3 leading-relaxed max-w-3xl">
                Monthly and quarterly partners book at the start of each billing period.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-sans-main text-base md:text-lg text-white/80 font-medium">
                <span>Pricing flexibility</span>
                <span className="text-[#a78bfa] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="font-serif-alt italic text-base text-white/50 mt-3 leading-relaxed max-w-3xl">
                One-off and monthly rates are fixed. Annual partners have some flexibility, particularly for early sign-ons.
              </p>
            </details>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className={`relative p-12 rounded-[40px] flex flex-col justify-between min-h-[400px] transition-all duration-300 hover:scale-[1.02] ${tier.light ? 'bg-[#849bff] text-white' : 'bg-[#222228] text-white border border-white/5'}`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <p className={`font-mono-main text-[10px] uppercase tracking-widest ${tier.light ? 'text-white/80' : 'opacity-40'}`}>{tier.price}</p>
                  {tier.foundersChoice && (
                    <span className="font-mono-main text-[9px] uppercase tracking-widest text-white/90 px-3 py-1 rounded-full bg-white/20">
                      Founder's choice
                    </span>
                  )}
                </div>
                <h3 className="font-sans-main text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                  {tier.title}
                </h3>
                <p className={`font-serif-alt italic text-xl ${tier.light ? 'text-white/80' : 'text-white/40'}`}>
                  {tier.desc}
                </p>
              </div>
              <a 
                href={tier.id === 'partner' ? DIGEST_STUDIO_URL : TALLY_INQUIRE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-12 w-full py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest border transition-all text-center block ${tier.light ? 'bg-white text-[#849bff] border-white hover:bg-[#faf9f6] hover:text-[#849bff]' : 'border-white/20 hover:bg-white hover:text-[#251f18]'}`}
              >
                {tier.id === 'partner' ? 'Visit Digest Studio' : 'Inquire →'}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-24 bg-[#849bff] rounded-[50px] p-12 md:p-24 text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="font-sans-main text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8">
              Let's talk about your growth.
            </h2>
            <p className="font-serif-alt italic text-2xl md:text-3xl opacity-80 max-w-2xl mx-auto mb-12">
              No complex funnels. Just real Newcastle locals ready to support your business.
            </p>
            <a 
              href={CAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#251f18] text-white px-12 py-6 rounded-full font-sans-main font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Book a call
            </a>
          </div>
        </div>
        {/* Closing section */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <h2 className="font-sans-display text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            7,000 locals open this newsletter more than half the time it lands.
          </h2>
          <p className="font-serif-alt italic text-xl md:text-2xl text-white/60 mb-10">
            That&apos;s the audience your business could be in front of next Wednesday.
          </p>
          <a
            href="#pricing"
            className="inline-block px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest border border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white transition-all"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
};
