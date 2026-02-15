import React from 'react';
import { Hero } from './Hero';
import { ExternalLink } from 'lucide-react';
import { TESTIMONIALS } from '../constants';

const BEEHIIV_PUB_URL = 'https://www.newcastledigest.com';

interface HomePageProps {
  setView?: (view: string) => void;
}

const NEWCASTLE_IMAGES = [
  { src: '/newcastle/204698-2-c7408bf5-95c7-4b0a-9fbe-778d60820d34.png', alt: 'Newcastle promenade' },
  { src: '/newcastle/204739-2-9f6c79cb-503b-4e6c-abf0-1c01ee1b1ff2.png', alt: 'Kayaks at Nobbys' },
  { src: '/newcastle/205005-2-379ef717-0a0e-41b2-b8d1-25dce36cc346.png', alt: 'Newcastle bridge' },
];

export const HomePage: React.FC<HomePageProps> = ({ setView }) => {
  return (
    <>
      <Hero />

      {/* Newcastle imagery */}
      <section className="py-12 md:py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {NEWCASTLE_IMAGES.map((img, i) => (
              <div key={i} className="rounded-[28px] overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] aspect-[4/3] bg-gray-100">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly pillars */}
      <section className="py-10 md:py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <a
              href="https://www.newcastledigest.com/p/gig-and-live-music-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-[32px] md:rounded-[40px] overflow-hidden bg-[#18181e] text-white p-10 md:p-14 min-h-[320px] md:min-h-[380px] relative transition-transform hover:scale-[1.01]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#849bff]/25 via-transparent to-transparent pointer-events-none" />
              <div className="relative h-full flex flex-col">
                <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-6">Weekly pillar</p>
                <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9] mt-auto">
                  The Gig Guide.
                </h2>
                <p className="font-serif-alt italic text-white/60 mt-4 text-lg">A complete guide to the shows worth leaving the house for. Updated weekly.</p>
                <span className="inline-flex items-center gap-2 mt-6 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all">
                  View guide <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>

            <a
              href="https://www.newcastledigest.com/p/market-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-[32px] md:rounded-[40px] overflow-hidden bg-[#f5f4f0] text-[#251f18] p-10 md:p-14 min-h-[320px] md:min-h-[380px] relative border border-[#251f18]/06 transition-transform hover:scale-[1.01] hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#849bff]/08 via-transparent to-transparent pointer-events-none" />
              <div className="relative h-full flex flex-col">
                <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#e07a5f] mb-6">Weekly pillar</p>
                <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9] text-[#251f18] mt-auto">
                  Local Markets.
                </h2>
                <p className="font-serif-alt italic text-[#251f18]/55 mt-4 text-lg">From growers markets to design stalls — discover what's on before the weekend arrives.</p>
                <span className="inline-flex items-center gap-2 mt-6 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all">
                  View guide <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* SPONSORSHIP / WORK WITH US */}
      {setView && (
        <section className="py-16 md:py-24 px-4 md:px-8">
          <div className="container mx-auto max-w-6xl">
            <button
              onClick={() => setView('work')}
              className="group block w-full rounded-[32px] md:rounded-[40px] overflow-hidden bg-[#251f18] text-white p-10 md:p-14 relative transition-transform hover:scale-[1.01] text-left"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.2),transparent_50%)] pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-4">SPONSORSHIP / WORK WITH US</p>
                  <h2 className="font-sans-main font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-[0.9]">
                    Partner with the Digest.
                  </h2>
                  <p className="font-sans-main text-white/90 mt-4 text-lg max-w-xl leading-snug">
                    Connect your brand with one of Newcastle's fastest-growing local audiences.
                  </p>
                  <p className="font-serif-alt italic text-white/60 mt-2 text-base">
                    Thoughtful placements. Engaged readers. Real local reach.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all self-start md:self-auto">
                  Explore options <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#f5f4f0]">
        <div className="container mx-auto max-w-6xl">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-8 text-center">What locals say</p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {TESTIMONIALS.map((t, i) => (
              <blockquote key={i} className="text-center">
                <p className="font-serif-alt italic text-xl md:text-2xl text-[#251f18]/85 leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <cite className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50 not-italic block mt-2">{t.attribution}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Latest edition */}
      <section id="latest" className="py-20 md:py-28 px-4 md:px-8 bg-[#18181e] text-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#849bff]/15 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-6">Wednesday chronicles</p>
              <h2 className="font-sans-main font-black text-5xl md:text-6xl lg:text-7xl uppercase tracking-tighter leading-[0.9] mb-6">
                This week in Newcastle.
              </h2>
              <p className="font-serif-alt italic text-xl text-white/70 leading-relaxed mb-10">
                The latest stories, guides, and curiosities from across the city, delivered every Wednesday.
              </p>
              <a
                href={BEEHIIV_PUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#849bff] text-white px-8 py-4 rounded-full font-mono-main text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#18181e] transition-all"
              >
                Read the latest issue <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="relative">
              <div className="rounded-[32px] overflow-hidden bg-[#222228] aspect-[4/5] max-w-md mx-auto lg:mx-0 shadow-2xl">
                <img
                  src="/newcastle/205071-2-42a04668-8baa-4c4a-acdf-1683e7c9333f.png"
                  alt="Latest edition"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 left-6 right-6 md:left-8 md:right-auto md:max-w-[220px] bg-white rounded-2xl p-5 shadow-xl text-[#251f18]">
                <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/60 mb-1">New edition</p>
                <p className="font-serif-alt italic text-[#251f18]">Every Wednesday morning</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
