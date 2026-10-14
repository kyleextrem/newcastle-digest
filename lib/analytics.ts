export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XK7000CZS7';

export type AnalyticsParams = Record<string, string | number | boolean | (() => void) | undefined>;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

function installGtagStub(): Gtag | null {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
  }
  return window.gtag;
}

export function sanitizePageLocation(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  const drop: string[] = [];
  url.searchParams.forEach((value, key) => {
    if (key.toLowerCase() === 'email' || value.includes('@')) {
      drop.push(key);
    }
  });
  for (const key of drop) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

export function trackEvent(name: string, params?: AnalyticsParams) {
  const gtag = installGtagStub();
  if (!gtag) return;

  const cleaned = params
    ? Object.fromEntries(Object.entries(params).filter((entry) => entry[1] !== undefined))
    : undefined;

  gtag('event', name, cleaned);
}

export function trackSignUp(
  input: { method: string; location: string },
  options?: { onComplete?: () => void },
) {
  if (typeof window === 'undefined') return;

  const finish = options?.onComplete;
  let finished = false;
  const complete = () => {
    if (finished) return;
    finished = true;
    finish?.();
  };

  trackEvent('sign_up', {
    method: input.method,
    location: input.location,
    ...(finish ? { event_callback: complete, event_timeout: 1000 } : {}),
  });

  if (finish) {
    window.setTimeout(complete, 1200);
  }
}
