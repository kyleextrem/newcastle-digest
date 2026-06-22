'use client';

import { useEffect, useRef } from 'react';

export function ThankYouLeadTracker() {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) return;
    const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead');
      hasTrackedRef.current = true;
    }
  }, []);

  return null;
}
