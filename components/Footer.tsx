import React from 'react';
import { Instagram, Twitter, MessageCircle, ArrowUp } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

interface FooterProps {
  setView: (view: string, options?: { hash?: string }) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {

  return (
    <footer className="bg-[#1a1611] text-[#faf9f6] py-16 md:py-24 lg:py-48 px-4 sm:px-6 md:px-8 overflow-hidden relative">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 lg:gap-20 xl:gap-24 items-start relative z-10">
          <div className="col-span-1 lg:col-span-2 max-w-md lg:max-w-lg space-y-6 md:space-y-8">
            <div className="flex flex-col">
              <img src={ndLogo} alt="Newcastle Digest" className="h-14 md:h-16 lg:h-20 w-auto object-contain mb-4 md:mb-6 opacity-90" />
              <h2 className="font-sans-main font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl uppercase tracking-tighter leading-[0.85] mb-6 md:mb-8">
                newcastle digest
              </h2>
              <p className="font-serif-alt italic text-lg md:text-2xl max-w-sm opacity-40">
                Independently curated for the thousands of locals who call Newcastle, NSW home.
              </p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-8 lg:pt-0">
            <h4 className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">Publishing</h4>
            <div className="flex flex-col space-y-4 md:space-y-6">
              {[
                { name: 'Home', v: 'home' },
                { name: 'Latest Edition', v: 'home' },
                { name: 'Previous Newsletters', v: 'previousNewsletters' },
                { name: 'Experiences', v: 'experiences' },
                { name: 'The Journal', v: 'journal' },
                { name: 'Subscribe', v: 'subscribe' }
              ].map(link => (
                <button key={link.name} onClick={() => setView(link.v, link.v === 'home' && link.name === 'Latest Edition' ? { hash: 'latest' } : undefined)} className="text-left font-sans-main text-2xl md:text-3xl font-black uppercase tracking-tighter hover:text-[#849bff] transition-colors">
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 md:space-y-8 lg:pt-0">
             <h4 className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">More</h4>
             <div className="flex flex-col space-y-4 md:space-y-6">
              {[
                { name: 'Work With Us', v: 'work' },
                { name: 'Behind the Digest', v: 'behind' },
                { name: 'Contact', v: 'contact' },
              ].map(link => (
                <button key={link.name} onClick={() => setView(link.v)} className="text-left font-sans-main text-2xl md:text-3xl font-black uppercase tracking-tighter hover:text-[#849bff] transition-colors">
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 lg:mt-48 pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-8 md:gap-12 relative z-10">
          <div className="space-y-4">
            <p className="font-mono-main text-[10px] uppercase tracking-widest opacity-20">
              © {new Date().getFullYear()} Newcastle Digest • All rights reserved
            </p>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]">
              A Digest Media Publication
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:gap-12">
            <a href="https://digeststudio.com.au" target="_blank" rel="noopener noreferrer" className="font-mono-main text-[10px] uppercase tracking-[0.2em] opacity-60 hover:text-[#849bff] hover:opacity-100 transition-colors">
              Built By Digest Studio
            </a>
            <div className="flex space-x-8 font-mono-main text-[10px] uppercase tracking-[0.2em] opacity-40">
               <button onClick={() => setView('privacy')} className="hover:text-[#849bff] transition-colors">
                 Privacy & Terms
               </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
