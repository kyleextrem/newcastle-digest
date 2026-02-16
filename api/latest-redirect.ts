/**
 * GET /api/latest-redirect
 * Server-side only: calls /api/latest, reads the returned url, responds with 302.
 * No page render, no client code. Used by rewrite /latest -> this.
 */
interface LatestApiResponse {
  title?: string;
  url?: string;
  publish_date?: string;
  error?: string;
}

export async function GET(request: Request) {
  const origin =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    new URL(request.url).origin;
  const apiUrl = `${origin}/api/latest`;

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Ensure we don't follow redirects; we want the JSON
      redirect: 'manual',
    });

    if (!res.ok) {
      return new Response('Could not load latest issue', { status: res.status >= 500 ? 502 : 404 });
    }

    const data = (await res.json()) as LatestApiResponse;

    if (!data?.url) {
      return new Response('No latest issue URL', { status: 404 });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: data.url,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    return new Response('Could not load latest issue', { status: 502 });
  }
}
