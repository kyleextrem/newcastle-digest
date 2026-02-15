import React from 'react';
import { HelpCircle, Calendar } from 'lucide-react';

export const HeroBento: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-fr">
          {/* Main feature - spans 2 rows, 7 cols on desktop */}
          <div className="md:col-span-7 md:row-span-2 relative rounded-[32px] overflow-hidden shadow-xl group">
            <img
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop"
              alt="Merewether"
              className="w-full h-full min-h-[320px] md:min-h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#251f18]/90 via-[#251f18]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="inline-block px-4 py-2 rounded-xl bg-[#849bff] font-mono-main text-[10px] uppercase tracking-[0.2em] text-white mb-4">
                Main feature
              </span>
              <h2 className="font-sans-main text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-[0.95]">
                Merewether's Best Kept Secret.
              </h2>
            </div>
          </div>

          {/* Weekly Trivia - light blue */}
          <div className="md:col-span-5 rounded-[32px] p-8 md:p-10 bg-[#849bff] text-white shadow-xl flex flex-col justify-between min-h-[240px]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sans-main text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
                  Weekly Trivia
                </h3>
                <p className="font-serif-alt italic text-white/90 text-sm md:text-base leading-snug">
                  Win vouchers to local spots by guessing the hidden landmark.
                </p>
              </div>
            </div>
          </div>

          {/* Weekend Gig Guide - coral */}
          <div className="md:col-span-5 rounded-[32px] p-8 md:p-10 bg-[#e07a5f] text-white shadow-xl flex flex-col justify-between min-h-[240px] relative overflow-hidden">
            <span className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-white/20 font-mono-main text-[9px] uppercase tracking-widest">
              Live now
            </span>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sans-main text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
                  Weekend Gig Guide
                </h3>
                <p className="font-serif-alt italic text-white/90 text-sm md:text-base leading-snug">
                  Who's playing where. Updated every Friday.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics card - dark */}
          <div className="md:col-span-5 rounded-[32px] p-8 md:p-10 bg-[#251f18] text-white shadow-xl flex flex-col justify-center min-h-[200px]">
            <div className="flex flex-wrap gap-x-8 gap-y-2 font-sans-main font-black text-3xl md:text-4xl tracking-tighter">
              <span>60%</span>
              <span>10%</span>
              <span className="text-[#849bff]">7k+</span>
            </div>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-white/50 mt-4">
              Open rate · Click rate · Locals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
