/**
 * GET /api/latest-redirect
 * Fetches the latest published post from Beehiiv and returns 302 to its URL.
 * Used by rewrite /latest -> this; API key and publication ID are server-only.
 */
const BEEHIIV_API = 'https://api.beehiiv.com/v2';

type Env = {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
};

interface BeehiivPost {
  id: string;
  title: string;
  web_url: string;
  publish_date: number;
  status?: string;
}

interface BeehiivPostsResponse {
  data: BeehiivPost[];
  limit: number;
  page: number;
  total_results: number;
  total_pages: number;
}

export async function GET() {
  const env = process.env as Env;
  const apiKey = env.BEEHIIV_API_KEY;
  const publicationId = env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return new Response('Server configuration error', { status: 500 });
  }

  const url = new URL(`${BEEHIIV_API}/publications/${publicationId}/posts`);
  url.searchParams.set('status', 'confirmed');
  url.searchParams.set('order_by', 'publish_date');
  url.searchParams.set('direction', 'desc');
  url.searchParams.set('limit', '1');

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return new Response('Could not load latest issue', { status: 502 });
    }

    const body = (await res.json()) as BeehiivPostsResponse;
    const post = body.data?.[0];

    if (!post?.web_url) {
      return new Response('No published post found', { status: 404 });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: post.web_url,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    return new Response('Could not load latest issue', { status: 502 });
  }
}
