import React from 'react';
import { Menu, X } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

interface NavbarProps {
  scrolled: boolean;
  setView: (view: string, options?: { hash?: string }) => void;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ scrolled, setView, currentView = 'home' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDark = currentView === 'work' || currentView === 'contact';

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isDark ? 'bg-[#18181e]/95 text-white' : 'bg-[#faf9f6]/95 text-[#251f18]'} backdrop-blur-md ${scrolled ? 'py-3 md:py-4 shadow-sm' : 'py-5 md:py-6'}`}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex justify-between items-center gap-4 md:gap-8">
        {/* Logo */}
        <button
          onClick={() => setView('home')}
          className="flex-shrink-0 flex items-center cursor-pointer focus:outline-none"
          aria-label="Newcastle Digest home"
        >
          <img src={ndLogo} alt="Newcastle Digest" className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center flex-1 justify-center gap-6 xl:gap-8 min-w-0">
          {links.map((link) => {
            const active = currentView === link.view && link.name !== 'Latest Edition';
            return (
              <button 
                key={link.name} 
                onClick={() => setView(link.view, (link as { hash?: string }).hash ? { hash: 'latest' } : undefined)}
                className={`relative pb-1.5 whitespace-nowrap text-[10px] font-sans-main font-black uppercase tracking-[0.2em] transition-colors ${isDark ? 'hover:text-[#849bff]' : 'hover:text-[#849bff]'} ${active && isDark ? 'text-white' : active ? 'text-[#251f18]' : isDark ? 'text-white' : 'text-[#251f18]'}`}
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
        <div className="flex items-center gap-3 flex-shrink-0">
           <button
             onClick={() => { setView('subscribe'); window.scrollTo(0, 0); }}
             className={`px-6 py-3 md:px-8 md:py-3.5 text-[10px] font-sans-main font-black uppercase tracking-[0.2em] transition-all rounded-full shadow-lg ${isDark ? 'bg-[#251f18] text-white hover:bg-white hover:text-[#251f18]' : 'bg-[#849bff] text-white hover:bg-[#6a7be6]'}`}
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

      {/* Mobile Menu - solid full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-[#faf9f6] flex flex-col p-6 sm:p-8" style={{ minHeight: '100dvh' }}>
          <div className="flex justify-between items-center mb-16">
            <button onClick={() => { setView('home'); setIsOpen(false); }} className="focus:outline-none">
              <img src={ndLogo} alt="Newcastle Digest" className="h-16 w-auto object-contain" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2">
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col space-y-6 sm:space-y-8 items-center justify-center flex-grow text-center py-8">
            {links.map((link) => (
              <button 
                key={link.name}
                onClick={() => { setView(link.view, (link as { hash?: string }).hash ? { hash: 'latest' } : undefined); setIsOpen(false); }}
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
