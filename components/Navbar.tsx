import React from 'react';
import { Menu, X } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

interface NavbarProps {
  scrolled: boolean;
  setView: (view: string) => void;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ scrolled, setView, currentView = 'home' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDark = currentView === 'work' || currentView === 'contact';

  const links = [
    { name: 'Home', view: 'home' },
    { name: 'Latest Edition', view: 'home', hash: 'latest' },
    { name: 'Experiences', view: 'experiences' },
    { name: 'Behind the Digest', view: 'behind' },
    { name: 'The Journal', view: 'journal' },
    { name: 'Work With Us', view: 'work' },
    { name: 'Contact', view: 'contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isDark ? 'bg-[#18181e]/95 text-white' : 'bg-[#faf9f6]/95 text-[#251f18]'} backdrop-blur-md ${scrolled ? 'py-4 shadow-sm' : 'py-8'}`}>
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <button
          onClick={() => setView('home')}
          className="flex items-center cursor-pointer focus:outline-none"
          aria-label="Newcastle Digest home"
        >
          <img src={ndLogo} alt="Newcastle Digest" className="h-16 sm:h-20 md:h-24 w-auto object-contain" />
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-10">
          {links.map((link) => {
            const active = currentView === link.view && link.name !== 'Latest Edition';
            return (
              <button 
                key={link.name} 
                onClick={() => { setView(link.view); window.scrollTo(0,0); if ((link as { hash?: string }).hash) setTimeout(() => document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                className={`relative pb-2 text-[10px] font-sans-main font-black uppercase tracking-[0.2em] transition-colors ${isDark ? 'hover:text-[#849bff]' : 'hover:text-[#849bff]'} ${active && isDark ? 'text-white' : active ? 'text-[#251f18]' : isDark ? 'text-white' : 'text-[#251f18]'}`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#849bff] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex items-center space-x-4">
           <button
             onClick={() => { setView('subscribe'); window.scrollTo(0, 0); }}
             className={`px-8 py-4 text-[10px] font-sans-main font-black uppercase tracking-[0.2em] transition-all rounded-full shadow-lg ${isDark ? 'bg-[#251f18] text-white hover:bg-white hover:text-[#251f18]' : 'bg-[#849bff] text-white hover:bg-[#6a7be6]'}`}
           >
             Subscribe
           </button>
          <button 
            onClick={() => setIsOpen(true)}
            className={`lg:hidden p-2 hover:opacity-70 transition-opacity ${isDark ? 'text-white' : 'text-[#251f18]'}`}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-[#faf9f6] flex flex-col p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-16">
            <button onClick={() => { setView('home'); setIsOpen(false); }} className="focus:outline-none">
              <img src={ndLogo} alt="Newcastle Digest" className="h-16 w-auto object-contain" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2">
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col space-y-8 items-center justify-center flex-grow text-center">
            {links.map((link) => (
              <button 
                key={link.name}
                onClick={() => { setView(link.view); setIsOpen(false); window.scrollTo(0,0); if ((link as { hash?: string }).hash) setTimeout(() => document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                className="text-4xl font-sans-main font-black uppercase tracking-tighter hover:text-[#849bff] transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
