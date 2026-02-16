import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { StoriesGrid } from './components/StoriesGrid';
import { Footer } from './components/Footer';
import { WorkWithUs } from './components/WorkWithUs';
import { BehindTheDigest } from './components/BehindTheDigest';
import { Experiences } from './components/Experiences';
import { SubscribePage } from './components/SubscribePage';
import { Contact } from './components/Contact';
import { PrivacyCopyright } from './components/PrivacyCopyright';
import { LatestRedirect } from './components/LatestRedirect';

const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  subscribe: '/subscribe',
  journal: '/journal',
  experiences: '/experiences',
  behind: '/behind',
  work: '/work',
  contact: '/contact',
  privacy: '/privacy',
};

const PATH_TO_VIEW: Record<string, string> = {
  '/': 'home',
  '/subscribe': 'subscribe',
  '/journal': 'journal',
  '/experiences': 'experiences',
  '/behind': 'behind',
  '/work': 'work',
  '/contact': 'contact',
  '/privacy': 'privacy',
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const pathname = location.pathname;
  const currentView = PATH_TO_VIEW[pathname] ?? 'home';

  const setView = (view: string, options?: { hash?: string }) => {
    const path = VIEW_TO_PATH[view] ?? '/';
    const target = options?.hash ? `${path}#${options.hash}` : path;
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (options?.hash) {
      setTimeout(() => document.getElementById(options.hash!)?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/' && window.location.hash === '#latest') {
      setTimeout(() => document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen font-sans-main flex flex-col overflow-x-hidden bg-[#faf9f6]">
      <Navbar scrolled={scrolled} setView={setView} currentView={currentView} />
      <main className="flex-grow pt-20 md:pt-24">
        <Routes>
          <Route path="/" element={<HomePage setView={setView} />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/journal" element={<StoriesGrid />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/behind" element={<BehindTheDigest />} />
          <Route path="/work" element={<WorkWithUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyCopyright />} />
          <Route path="/latest" element={<LatestRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer setView={setView} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
