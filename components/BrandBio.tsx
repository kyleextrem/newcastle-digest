
import React from 'react';

export const BrandBio: React.FC = () => {
  return (
    <section className="py-24 md:py-48 px-4 md:px-8 bg-transparent">
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif-main text-6xl md:text-8xl text-[#849bff] leading-[0.95] mb-16 uppercase">
            We're your friend who always knows what's happening around town.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 text-left items-start">
            <div className="space-y-6">
               <p className="font-mono-main text-xs uppercase tracking-[0.2em] text-[#251f18]/60">
                 What you'll get in your inbox:
               </p>
               <ul className="font-serif-alt text-xl md:text-2xl space-y-4 text-[#251f18]/80 list-disc pl-5">
                 <li><span className="font-bold text-[#251f18]">Tuesday:</span> An original story about local people, places, history, and happenings.</li>
                 <li><span className="font-bold text-[#251f18]">Thursday:</span> A huge list of things to do in the Newcastle area this weekend.</li>
                 <li><span className="font-bold text-[#251f18]">Monthly:</span> A Plan Ahead guide for the upcoming month.</li>
               </ul>
            </div>
            
            <div className="font-serif-alt text-xl md:text-2xl italic leading-relaxed text-[#251f18]/80 border-l border-[#849bff]/20 pl-8">
              "Newcastle is more than just a coal port; it's a thriving community of artists, surfers, and innovators. Our mission is to tell the stories that usually go unheard."
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
