/**
 * GET /api/latest-redirect
 * Server-side only: calls /api/latest, reads url, 302 to it. No UI.
 * Rewrite /latest -> this. On any failure, redirect to newsletter homepage.
 */
const FALLBACK_URL = 'https://newsletter.newcastledigest.com';

interface LatestApiResponse {
  title?: string;
  url?: string;
  publish_date?: string;
  error?: string;
}

function isValidRedirectUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length > 0 && !url.includes('/latest');
}

export async function GET(request: Request) {
  const host = request.headers.get('host') || new URL(request.url).host;
  const proto = process.env.VERCEL ? 'https' : 'http';
  const apiUrl = `${proto}://${host}/api/latest`;

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      cache: 'no-store',
    });

    if (!res.ok) {
      return redirectToFallback();
    }

    const data = (await res.json()) as LatestApiResponse;

    if (!isValidRedirectUrl(data?.url)) {
      return redirectToFallback();
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: data.url,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    return redirectToFallback();
  }
}

function redirectToFallback(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: FALLBACK_URL,
      'Cache-Control': 'public, s-maxage=60',
    },
  });
}
