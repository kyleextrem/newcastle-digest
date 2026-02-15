import React from 'react';
import ndLogo from '../src/assets/nd-logo.png';

export const BehindTheDigest: React.FC = () => {
  return (
    <section className="bg-[#faf9f6] min-h-screen py-20 md:py-28 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div className="space-y-8">
            <img src={ndLogo} alt="Newcastle Digest" className="h-20 md:h-24 w-auto object-contain" />
            <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff]">Behind the Digest</p>
            <h1 className="font-sans-main font-black text-6xl md:text-8xl uppercase leading-[0.8] tracking-tighter text-[#251f18]">
              I'm<br />Kyle.
            </h1>
            <p className="font-serif-alt italic text-2xl text-[#251f18]/60">Founder, Newcastle Digest</p>

            <div className="space-y-6 font-serif-alt text-xl leading-relaxed text-[#251f18]/80">
              <p>
                Newcastle Digest started because I wanted a simple way to see what was happening across the city: what was on, what looked good, and what was actually worth leaving the house for.
              </p>
              <p>
                It also gave me a reason to get out and experience more of Newcastle myself.
              </p>
              <p>
                What began as a personal email has grown into a weekly read for thousands of locals who want to stay in the loop and make the most of the city.
              </p>
              <p>
                That's still the focus today: helping people discover what's happening around them and feel more connected to where they live.
              </p>
            </div>

            <div className="pt-8 border-t border-[#251f18]/10">
              <h3 className="font-sans-main text-2xl font-black uppercase tracking-tighter mb-3">
                Newcastle is home. This is built for the people who call it home too.
              </h3>
              <p className="font-sans-main text-[#849bff] text-3xl font-black italic">Kyle</p>
            </div>
          </div>

          <div className="sticky top-40">
            <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl bg-gray-200">
              <img
                src="/kyle-headshot.png"
                alt="Kyle"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
