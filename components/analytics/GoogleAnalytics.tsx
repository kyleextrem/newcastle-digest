'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GA_MEASUREMENT_ID, sanitizePageLocation } from '@/lib/analytics';

function analyticsAllowed(pathname: string) {
  if (process.env.NODE_ENV !== 'production') return false;
  if (pathname.startsWith('/studio') || pathname.startsWith('/api')) return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return true;
}

export function GoogleAnalytics() {
  const pathname = usePathname() || '/';
  const [enabled, setEnabled] = useState(false);
  const landingPath = useRef<string | null>(null);

  useEffect(() => {
    setEnabled(analyticsAllowed(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    if (landingPath.current === null) {
      landingPath.current = pathname;
      return;
    }
    if (typeof window.gtag !== 'function') return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: sanitizePageLocation(window.location.href),
    });
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <>
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          function sanitizeLocation(href) {
            try {
              var url = new URL(href);
              var drop = [];
              url.searchParams.forEach(function(value, key) {
                if (key.toLowerCase() === 'email' || value.indexOf('@') !== -1) drop.push(key);
              });
              drop.forEach(function(key) { url.searchParams.delete(key); });
              return url.toString();
            } catch (error) {
              return href;
            }
          }
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
            page_location: sanitizeLocation(window.location.href)
          });
        `}
      </Script>
    </>
  );
}
