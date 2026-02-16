/**
 * GET /api/issues
 * Lists latest published Beehiiv posts for the archive. Uses BEEHIIV_API_KEY and
 * BEEHIIV_PUBLICATION_ID (server-only). Cached 15 minutes.
 */
const BEEHIIV_API = 'https://api.beehiiv.com/v2';

type Env = {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
};

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  web_url: string;
  publish_date: number;
  slug: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  thumbnail_image_url?: string;
}

interface BeehiivPostsResponse {
  data: BeehiivPost[];
  limit: number;
  page: number;
  total_results: number;
  total_pages: number;
}

export interface IssueItem {
  title: string;
  slug: string;
  web_url: string;
  published_at: string;
  subtitle: string;
  thumbnail_url: string | null;
}

function pickThumbnail(post: BeehiivPost): string | null {
  return (
    post.thumbnail_url ??
    post.cover_image_url ??
    (post as BeehiivPost & { thumbnail_image_url?: string }).thumbnail_image_url ??
    null
  );
}

export async function GET() {
  const env = process.env as Env;
  const apiKey = env.BEEHIIV_API_KEY;
  const publicationId = env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(`${BEEHIIV_API}/publications/${publicationId}/posts`);
  url.searchParams.set('limit', '50');
  url.searchParams.set('status', 'confirmed');
  url.searchParams.set('order_by', 'publish_date');
  url.searchParams.set('direction', 'desc');

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
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await res.json()) as BeehiivPostsResponse;
    const items: IssueItem[] = (body.data ?? []).map((post) => ({
      title: post.title ?? '',
      slug: post.slug ?? '',
      web_url: post.web_url ?? '',
      published_at: post.publish_date
        ? new Date(post.publish_date * 1000).toISOString()
        : '',
      subtitle: post.subtitle ?? '',
      thumbnail_url: pickThumbnail(post),
    }));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to fetch issues', details: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
