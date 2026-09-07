/**
 * GET /api/beehiiv?type=issues | ?type=latest
 * - type=issues: list of published Beehiiv posts (cached 15 min)
 *   Optional: &content_tag=blog to filter by content tag "blog"
 * - type=latest: single latest post { title, url, publish_date } (cached 5 min)
 * Uses BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID (server-only).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import {
  getLatestPublicEdition,
  isBeehiivConfigured,
  listPublicEditionApiItems,
} from '@/lib/beehiiv';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');

  if (type !== 'issues' && type !== 'latest') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid query: type=issues or type=latest' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!isBeehiivConfigured()) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (type === 'latest') {
      const post = await getLatestPublicEdition();
      if (!post) {
        return new Response(
          JSON.stringify({ error: 'No published post found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(post), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }

    const contentTag = request.nextUrl.searchParams.get('content_tag') ?? undefined;
    const items = await listPublicEditionApiItems(50, contentTag);
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
