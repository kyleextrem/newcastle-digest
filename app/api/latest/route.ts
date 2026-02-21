/**
 * GET /api/latest
 * Fetches the latest published post from Beehiiv. API key and publication ID are server-only. Cached 5 min.
 */
const BEEHIIV_API = 'https://api.beehiiv.com/v2';

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
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
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
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: 'Beehiiv API error', details: text }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await res.json()) as BeehiivPostsResponse;
    const post = body.data?.[0];

    if (!post) {
      return new Response(
        JSON.stringify({ error: 'No published post found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      title: post.title,
      url: post.web_url,
      publish_date: new Date(post.publish_date * 1000).toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to fetch latest post', details: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
