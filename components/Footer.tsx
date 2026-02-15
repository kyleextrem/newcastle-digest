import React from 'react';
import { Instagram, Twitter, MessageCircle, ArrowUp } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

interface FooterProps {
  setView: (view: string, options?: { hash?: string }) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {

  return (
    <footer className="bg-[#1a1611] text-[#faf9f6] py-24 md:py-48 px-4 md:px-8 overflow-hidden relative">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-24 items-start relative z-10">
          <div className="col-span-1 lg:col-span-2 space-y-12">
            <div className="flex flex-col">
              <img src={ndLogo} alt="Newcastle Digest" className="h-16 md:h-20 w-auto object-contain mb-6 opacity-90" />
               <h2 className="font-sans-main font-black text-6xl md:text-9xl uppercase tracking-tighter leading-[0.8] mb-8">
                newcastle digest
              </h2>
              <p className="font-serif-alt italic text-2xl max-w-sm opacity-40">
                Independently curated for the thousands of locals who call Newcastle, NSW home.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">Publishing</h4>
            <div className="flex flex-col space-y-6">
              {[
                { name: 'Home', v: 'home' },
                { name: 'Latest Edition', v: 'home' },
                { name: 'Experiences', v: 'experiences' },
                { name: 'The Journal', v: 'journal' },
                { name: 'Subscribe', v: 'subscribe' }
              ].map(link => (
                <button key={link.name} onClick={() => setView(link.v, link.v === 'home' && link.name === 'Latest Edition' ? { hash: 'latest' } : undefined)} className="text-left font-sans-main text-3xl font-black uppercase tracking-tighter hover:text-[#849bff] transition-colors">
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
             <h4 className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">More</h4>
             <div className="flex flex-col space-y-6">
              {[
                { name: 'Work With Us', v: 'work' },
                { name: 'Behind the Digest', v: 'behind' },
                { name: 'Contact', v: 'contact' },
              ].map(link => (
                <button key={link.name} onClick={() => setView(link.v)} className="text-left font-sans-main text-3xl font-black uppercase tracking-tighter hover:text-[#849bff] transition-colors">
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-48 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-end gap-12 relative z-10">
          <div className="space-y-4">
            <p className="font-mono-main text-[10px] uppercase tracking-widest opacity-20">
              © {new Date().getFullYear()} Newcastle Digest • All rights reserved
            </p>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]">
              A Digest Media Publication
            </p>
          </div>
          <div className="flex items-center space-x-12">
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
