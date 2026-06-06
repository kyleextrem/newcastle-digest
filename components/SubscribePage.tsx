'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Check } from 'lucide-react';

const THANK_YOU_URL = 'https://www.newcastledigest.com/thank-you';
const BEEHIIV_EMBED_URL = `https://embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9?slim=true&redirect_to=${encodeURIComponent(THANK_YOU_URL)}`;
const BEEHIIV_DIRECT_SUBSCRIBE_URL = 'https://newsletter.newcastledigest.com/subscribe';

const BENEFITS = [
  'Trusted by thousands of Newcastle locals',
  'Stories, guides, and curiosities from across the city',
  'Gig guide — who\'s playing where, every week',
  'Markets, makers, and where to go this weekend',
];

export const SubscribePage: React.FC = () => {
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const hasTrackedLeadRef = useRef(false);

  const trackLead = () => {
    if (hasTrackedLeadRef.current) return;
    const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead');
      hasTrackedLeadRef.current = true;
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes('beehiiv.com')) return;

      let payload: unknown = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // Keep raw string payload if not JSON
        }
      }

      const payloadText =
        typeof payload === 'string'
          ? payload.toLowerCase()
          : JSON.stringify(payload ?? '').toLowerCase();

      const hasSubscribeSignal =
        payloadText.includes('subscribe') ||
        payloadText.includes('subscription') ||
        payloadText.includes('beehiiv');
      const hasSuccessSignal =
        payloadText.includes('success') ||
        payloadText.includes('submitted') ||
        payloadText.includes('complete') ||
        payloadText.includes('confirmed');

      if (hasSubscribeSignal && hasSuccessSignal) {
        trackLead();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      <Script
        src="https://subscribe-forms.beehiiv.com/attribution.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: value bullets */}
      <div className="order-2 md:order-1 relative w-full md:w-[48%] lg:w-[45%] min-h-[40vh] md:min-h-screen flex flex-col justify-center px-6 sm:px-10 md:px-12 lg:px-16 py-16 md:py-24 overflow-hidden">
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
          <p className="hidden md:block font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#849bff] mb-8">
            Read by 7,000+ Newcastle locals.
          </p>
          <h1 className="hidden md:block font-sans-main font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-tighter leading-[0.88] mb-6 md:mb-8 text-white">
            The best of Newcastle.
            <br />
            <span className="text-[#849bff]">In your inbox.</span>
          </h1>
          <p className="hidden md:block font-serif-alt italic text-lg md:text-xl text-white/80 leading-relaxed mb-2">
            Events, openings, food, markets, and local finds — curated into one email every Wednesday.
          </p>
          <p className="hidden md:block font-mono-main text-[10px] uppercase tracking-[0.2em] text-white/60 mb-12">
            Read in under 5 minutes.
          </p>
          <p className="md:hidden font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff] mb-6">
            Why locals read the Digest
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
      <div className="order-1 md:order-2 relative w-full md:w-[52%] lg:w-[55%] min-h-[60vh] md:min-h-screen flex flex-col items-center justify-center px-6 sm:px-10 md:px-12 lg:px-20 py-16 md:py-24 bg-[#faf9f6]">
        <div className="w-full max-w-[420px] mx-auto">
          <p className="md:hidden font-mono-main text-[10px] uppercase tracking-[0.35em] text-[#849bff] mb-5">
            Read by 7,000+ Newcastle locals.
          </p>
          <h1 className="md:hidden font-sans-main font-black text-4xl sm:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18] mb-4">
            The best of Newcastle.
            <br />
            <span className="text-[#849bff]">In your inbox.</span>
          </h1>
          <p className="md:hidden font-serif-alt italic text-lg text-[#251f18]/80 leading-relaxed mb-6">
            Events, openings, food, markets, and local finds — curated into one email every Wednesday.
          </p>

          <img src="/nd-logo.png" alt="Newcastle Digest" className="hidden md:block h-20 md:h-24 w-auto object-contain mb-10" />

          <h2 className="hidden md:block font-sans-main font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-[#251f18] mb-3">
            Join the Digest.
          </h2>
          <p className="hidden md:block font-sans-main text-base font-medium text-[#251f18] mb-6">
            Join 7,000+ locals who use the Digest to decide where to go each week.
          </p>

          {/* Form wrapper - iframe is cross-origin; aria-label on iframe provides accessibility */}
          <div className="mb-6">
            <div className="beehiiv-embed-wrap">
              <iframe
                src={BEEHIIV_EMBED_URL}
                data-test-id="beehiiv-embed"
                height="52"
                frameBorder="0"
                scrolling="no"
                style={{ margin: 0, borderRadius: 0, backgroundColor: 'transparent' }}
                title="Subscribe to Newcastle Digest - Enter your email and click Join the Digest"
                aria-label="Email subscription form"
                onLoad={() => setEmbedLoaded(true)}
              />
            </div>
            {!embedLoaded && showFallback && (
              <a
                href={`${BEEHIIV_DIRECT_SUBSCRIBE_URL}?redirect_to=${encodeURIComponent(THANK_YOU_URL)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-4 px-6 py-3 rounded-full bg-[#251f18] text-[#faf9f6] font-mono-main text-[10px] uppercase tracking-widest hover:bg-[#849bff] transition-colors"
              >
                Open subscribe form
              </a>
            )}
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
    </>
  );
};
