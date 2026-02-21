/**
 * GET /api/beehiiv?type=issues | ?type=latest
 * - type=issues: list of published Beehiiv posts (cached 15 min)
 * - type=latest: single latest post { title, url, publish_date } (cached 5 min)
 * Uses BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID (server-only).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  web_url: string;
  publish_date: number;
  slug: string;
  status?: string;
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

function pickThumbnail(post: BeehiivPost): string | null {
  return (
    post.thumbnail_url ??
    post.cover_image_url ??
    (post as BeehiivPost & { thumbnail_image_url?: string }).thumbnail_image_url ??
    null
  );
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');

  if (type !== 'issues' && type !== 'latest') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid query: type=issues or type=latest' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
  if (type === 'issues') {
    url.searchParams.set('limit', '50');
  } else {
    url.searchParams.set('limit', '1');
  }

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
        { status: type === 'latest' ? 502 : 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await res.json()) as BeehiivPostsResponse;

    if (type === 'latest') {
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
    }

    const items = (body.data ?? []).map((post) => ({
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
      JSON.stringify({
        error: type === 'latest' ? 'Failed to fetch latest post' : 'Failed to fetch issues',
        details: message,
      }),
      { status: type === 'latest' ? 502 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
