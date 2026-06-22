
import React from 'react';

export const ThingsToDo: React.FC = () => {
  return (
    <section className="py-24 md:py-48 px-4 md:px-8 bg-white border-y border-[#251f18]/5">
      <div className="container mx-auto grid lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-12">
          <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff]">Weekly Pillar</p>
          <h2 className="font-sans-main text-8xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8]">
            The Gig<br/>Guide.
          </h2>
          <p className="font-serif-alt italic text-2xl text-[#251f18]/60 max-w-xl leading-relaxed">
            Your curated list of live music, theatre, and events happening across the city this weekend.
          </p>
          <button className="bg-[#849bff] text-white px-10 py-5 font-mono-main text-xs uppercase tracking-widest hover:bg-[#251f18] transition-all rounded-full shadow-lg shadow-[#849bff]/20">
            See this week's gigs &rarr;
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
           <div className="p-12 rounded-[50px] bg-[#faf9f6] border border-[#251f18]/5 space-y-8">
              <div className="w-16 h-16 bg-[#849bff] text-white flex items-center justify-center rounded-2xl">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <h3 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-none">Weekly<br/>Trivia</h3>
              <p className="font-serif-alt italic text-lg opacity-60 leading-tight">Win vouchers to local spots by guessing the hidden landmark.</p>
           </div>
           <div className="p-12 rounded-[50px] bg-[#251f18] text-white space-y-8 mt-12">
              <div className="w-16 h-16 bg-[#849bff] text-white flex items-center justify-center rounded-2xl">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">Live Now</p>
              <h3 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-none">Weekend<br/>Markets</h3>
              <p className="font-serif-alt italic text-lg opacity-40 leading-tight">A full directory of farmers markets and makers stalls.</p>
           </div>
        </div>
      </div>
    </section>
  );
};
