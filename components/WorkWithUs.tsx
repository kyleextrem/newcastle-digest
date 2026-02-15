
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
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-white/10 pb-16">
          <div className="space-y-4">
            <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff]">Business Partnerships</p>
            <h1 className="font-sans-main text-8xl md:text-[10rem] font-black uppercase leading-[0.8] tracking-tighter">
              Work<br/>With<br/>Us.
            </h1>
          </div>
          <div className="mt-12 md:mt-0 text-right">
             <p className="font-sans-main text-6xl md:text-8xl font-black text-[#849bff]">7,000+</p>
             <p className="font-mono-main text-[10px] uppercase tracking-widest opacity-40">Local eyes every week</p>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-b border-white/10 mb-16">
          <div className="text-center md:text-left">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-white/60">Avg. open rate</p>
            <p className="font-sans-main text-4xl md:text-5xl font-black text-white mt-2">60%</p>
          </div>
          <div className="text-center md:text-left">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-white/60">Avg. click rate</p>
            <p className="font-sans-main text-4xl md:text-5xl font-black text-white mt-2">10%</p>
          </div>
          <div className="text-center md:text-left">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-white/60">Newcastle locals</p>
            <p className="font-sans-main text-4xl md:text-5xl font-black text-[#849bff] mt-2">7,000+</p>
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
              href={DIGEST_STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#251f18] text-white px-12 py-6 rounded-full font-sans-main font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Contact Kyle @ Digest Studio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
