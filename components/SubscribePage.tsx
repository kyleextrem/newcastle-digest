import React from 'react';
import { Check } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

const BEEHIIV_EMBED_URL = 'https://embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9?slim=true';

const BENEFITS = [
  'Trusted by thousands of Newcastle locals',
  'Stories, guides, and curiosities from across the city',
  'Gig guide — who\'s playing where, every week',
  'Markets, makers, and where to go this weekend',
];

export const SubscribePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: value bullets */}
      <div className="relative w-full md:w-[48%] lg:w-[45%] min-h-[40vh] md:min-h-screen flex flex-col justify-center px-6 sm:px-10 md:px-12 lg:px-16 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/newcastle/205091-2-09d6d7c1-47e3-48d7-84a4-672f358f231d.png"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#251f18]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_80%,rgba(132,155,255,0.2),transparent_50%)]" />
        </div>
        <div className="relative z-10 max-w-lg">
          <p className="font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#849bff] mb-8">
            Read by 7,000+ Newcastle locals.
          </p>
          <h1 className="font-sans-main font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-tighter leading-[0.88] mb-6 md:mb-8 text-white">
            The best of Newcastle.
            <br />
            <span className="text-[#849bff]">In your inbox.</span>
          </h1>
          <p className="font-serif-alt italic text-lg md:text-xl text-white/80 leading-relaxed mb-2">
            Events, openings, food, markets, and local finds — curated into one email every Wednesday.
          </p>
          <p className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-white/60 mb-12">
            Read in under 5 minutes.
          </p>
          <ul className="space-y-4">
            {BENEFITS.map((line, i) => (
              <li key={i} className="flex items-start gap-3 font-sans-main text-sm md:text-base text-white/90">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#849bff]/30 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-[#849bff]" strokeWidth={3} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="relative w-full md:w-[52%] lg:w-[55%] min-h-[60vh] md:min-h-screen flex flex-col items-center justify-center px-6 sm:px-10 md:px-12 lg:px-20 py-16 md:py-24 bg-[#faf9f6]">
        <div className="w-full max-w-[420px] mx-auto">
          <img src={ndLogo} alt="Newcastle Digest" className="h-20 md:h-24 w-auto object-contain mb-10" />

          <h2 className="font-sans-main font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18] mb-3">
            Join the Digest.
          </h2>
          <p className="font-sans-main text-base font-medium text-[#251f18] mb-6">
            Join 7,000+ locals who use the Digest to decide where to go each week.
          </p>

          {/* Form wrapper - iframe is cross-origin; aria-label on iframe provides accessibility */}
          <div className="mb-6">
            <div className="beehiiv-embed-wrap focus-within:ring-2 focus-within:ring-[#849bff]/40 focus-within:ring-offset-2 rounded-[14px] transition-shadow">
              <iframe
                src={BEEHIIV_EMBED_URL}
                data-test-id="beehiiv-embed"
                height="64"
                frameBorder="0"
                scrolling="no"
                title="Subscribe to Newcastle Digest - Enter your email and click Join the Digest"
                aria-label="Email subscription form"
              />
            </div>
          </div>

          <p className="font-serif-alt italic text-sm text-[#251f18]/70 mb-3">
            No algorithms. Just the best of the city, once a week.
          </p>

          <p className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
            Free. No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
