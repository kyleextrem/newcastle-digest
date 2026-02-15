import React from 'react';

const BEEHIIV_EMBED_URL = 'https://embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9?slim=true';

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-[88vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-[#faf9f6]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(132,155,255,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(132,155,255,0.06),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.8),transparent_30%)]" />
      {/* Soft grid texture - very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#251f18 1px, transparent 1px), linear-gradient(90deg, #251f18 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Abstract shape - adds depth without clutter */}
      <div className="absolute top-1/2 right-0 w-[60vw] max-w-[700px] h-[70vw] max-h-[700px] -translate-y-1/2 translate-x-1/3 rounded-full bg-[#849bff]/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] max-w-[400px] h-[40vw] max-h-[400px] translate-y-1/2 -translate-x-1/4 rounded-full bg-[#251f18]/[0.03] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Headline - full width, stretched across */}
          <div className="w-full max-w-5xl mx-auto mb-14 md:mb-16">
            <div className="inline-block h-px w-12 bg-[#849bff]/40 mb-8" aria-hidden />
            <p className="font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#251f18]/50 mb-6">
              Read by 7,000+ Newcastle locals.
            </p>
            <h1 className="font-sans-main font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.5rem] uppercase tracking-tighter leading-[0.82]">
              <span className="text-[#251f18]">The best of Newcastle,</span>
              <br />
              <span className="text-[#849bff]">delivered directly to you.</span>
            </h1>
            <p className="font-serif-alt italic text-lg md:text-xl text-[#251f18]/55 mt-8 max-w-2xl mx-auto leading-relaxed">
              Food, events, openings, culture, and local finds — thoughtfully curated into one weekly email.
            </p>
          </div>

          {/* Subscribe module - full width like Work With Us, form centred inside */}
          <div className="w-full">
            <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-[#251f18] text-white p-10 md:p-14 shadow-[0_20px_50px_-16px_rgba(37,31,24,0.25)] flex justify-center">
              <div className="w-full max-w-md text-center">
                <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-3">
                  Get the digest
                </p>
                <p className="font-sans-main text-white/80 text-sm mb-5">
                  One email a week. No spam, just Newcastle.
                </p>
                <div className="beehiiv-embed-wrap bg-[#faf9f6] rounded-xl overflow-hidden border border-white/10">
                  <iframe
                    src={BEEHIIV_EMBED_URL}
                    data-test-id="beehiiv-embed"
                    height="64"
                    frameBorder="0"
                    scrolling="no"
                    title="Subscribe to Newcastle Digest"
                  />
                </div>
                <p className="font-mono-main text-[9px] uppercase tracking-widest text-white/45 mt-4">
                  Free. No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
