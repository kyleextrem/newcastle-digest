import React from 'react';
import { ExternalLink, MapPin, Heart } from 'lucide-react';

const EXPERIENCES_URL = 'https://experiences.newcastledigest.com';

export const Experiences: React.FC = () => {
  return (
    <section className="bg-[#faf9f6] min-h-screen py-24 px-4 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center mb-20">
          <div>
            <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-4">Curated for locals</p>
            <h1 className="font-sans-main text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.85] tracking-tighter text-[#251f18] mb-6">
              Experiences.
            </h1>
            <p className="font-serif-alt italic text-2xl text-[#251f18]/70 leading-snug mb-8">
              Hand-picked guides to the places we actually go: neighbourhood guides, date night ideas, and the best of Newcastle in one place.
            </p>
            <a
              href={EXPERIENCES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#251f18] text-white px-10 py-5 font-mono-main text-xs uppercase tracking-widest hover:bg-[#849bff] transition-all rounded-full"
            >
              Explore experiences <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] overflow-hidden aspect-[3/4] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop"
                alt="Newcastle neighbourhood"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-[24px] overflow-hidden aspect-[3/4] shadow-xl mt-8">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop"
                alt="Local dining"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-4 p-8 rounded-3xl bg-white border border-[#251f18]/5">
            <div className="w-12 h-12 rounded-full bg-[#849bff]/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#849bff]" />
            </div>
            <h3 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Neighbourhood guides</h3>
            <p className="font-serif-alt italic text-[#251f18]/60">
              Deep dives into Newcastle's suburbs: where to eat, drink, and wander.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4 p-8 rounded-3xl bg-white border border-[#251f18]/5">
            <div className="w-12 h-12 rounded-full bg-[#e07a5f]/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#e07a5f]" />
            </div>
            <h3 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Date night guides</h3>
            <p className="font-serif-alt italic text-[#251f18]/60">
              Curated evenings: restaurants, bars, and spots that hit different.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <a
            href={EXPERIENCES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#849bff] font-mono-main text-xs uppercase tracking-widest hover:underline"
          >
            Go to experiences.newcastledigest.com <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
