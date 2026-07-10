'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isThankYou = pathname === '/thank-you';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined' && window.location.hash === '#latest') {
      setTimeout(() => document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen font-sans-main flex flex-col overflow-x-hidden bg-[#faf9f6]">
      {!isThankYou && <Navbar scrolled={scrolled} pathname={pathname} />}
      <main className={isThankYou ? 'flex-grow' : 'flex-grow pt-20 md:pt-24'}>
        {children}
      </main>
      {!isThankYou && <Footer />}
    </div>
  );
}
