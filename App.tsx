import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [view, setView] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderView = () => {
    switch (view) {
      case 'experiences':
        return <Experiences />;
      case 'behind':
        return <BehindTheDigest />;
      case 'work':
        return <WorkWithUs />;
      case 'journal':
        return <StoriesGrid />;
      case 'subscribe':
        return <SubscribePage />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <PrivacyCopyright />;
      default:
        return <HomePage setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen font-sans-main flex flex-col overflow-x-hidden bg-[#faf9f6]">
      <Navbar scrolled={scrolled} setView={setView} currentView={view} />

      <main className="flex-grow pt-24">
        {renderView()}
      </main>

      <Footer setView={setView} />
    </div>
  );
};

export default App;
