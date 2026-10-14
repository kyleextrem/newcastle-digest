'use client';

import { useEffect, useRef } from 'react';
import { trackSignUp } from '@/lib/analytics';
import { thankYouPath } from '@/lib/beehiiv-embed';
import { markSignupTracked, markSubscribed, rememberPendingEmail } from '@/lib/subscriber-session';

function extractEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;

  if (typeof obj.email === 'string' && obj.email.includes('@')) return obj.email;
  if (typeof obj.subscriber_email === 'string' && obj.subscriber_email.includes('@')) {
    return obj.subscriber_email;
  }

  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (typeof data.email === 'string' && data.email.includes('@')) return data.email;
  }

  return null;
}

function isBeehiivSuccess(payload: unknown) {
  const payloadText =
    typeof payload === 'string' ? payload.toLowerCase() : JSON.stringify(payload ?? '').toLowerCase();
  const hasSubscribeSignal =
    payloadText.includes('subscribe') ||
    payloadText.includes('subscription') ||
    payloadText.includes('beehiiv');
  const hasSuccessSignal =
    payloadText.includes('success') ||
    payloadText.includes('submitted') ||
    payloadText.includes('complete') ||
    payloadText.includes('confirmed');
  return hasSubscribeSignal && hasSuccessSignal;
}

export function useBeehiivSubscribeSuccess(location: string) {
  const handled = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin?.includes('beehiiv.com')) return;
      if (handled.current) return;

      let payload: unknown = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // Keep the raw string when beehiiv does not send JSON.
        }
      }

      if (!isBeehiivSuccess(payload)) return;

      handled.current = true;
      rememberPendingEmail(extractEmail(payload));
      markSubscribed();
      markSignupTracked();
      trackSignUp({ method: 'beehiiv_embed', location }, {
        onComplete: () => {
          window.location.assign(thankYouPath(location));
        },
      });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [location]);
}
