/**
 * GET /latest — server-side redirect to latest Beehiiv post URL.
 * On failure, redirects to newsletter homepage.
 */
import { NextRequest } from 'next/server';

const FALLBACK_URL = 'https://newsletter.newcastledigest.com';

function isValidRedirectUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length > 0 && !url.includes('/latest');
}

export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  const apiUrl = `${base}/api/beehiiv?type=latest`;

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      cache: 'no-store',
    });

    if (!res.ok) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: FALLBACK_URL,
          'Cache-Control': 'public, s-maxage=60',
        },
      });
    }

    const data = (await res.json()) as { url?: string };

    if (!isValidRedirectUrl(data?.url)) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: FALLBACK_URL,
          'Cache-Control': 'public, s-maxage=60',
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: data.url,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    return new Response(null, {
      status: 302,
      headers: {
        Location: FALLBACK_URL,
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  }
}
