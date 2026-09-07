/**
 * POST /api/beehiiv/subscriber
 * Updates a subscriber's postcode custom field and/or tags.
 * Body: { email: string, postcode?: string, tags?: string[] }
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

interface SubscriberRequest {
  email?: string;
  postcode?: string;
  tags?: string[];
}

interface BeehiivSubscription {
  id: string;
  email: string;
}

async function beehiivFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    throw new Error('Server configuration error');
  }

  const res = await fetch(`${BEEHIIV_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return res;
}

function getPublicationId() {
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!publicationId) {
    throw new Error('Server configuration error');
  }
  return publicationId;
}

export async function POST(request: NextRequest) {
  let body: SubscriberRequest;
  try {
    body = (await request.json()) as SubscriberRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const publicationId = getPublicationId();

    if (body.postcode?.trim()) {
      const res = await beehiivFetch(
        `/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            custom_fields: [{ name: 'postcode', value: body.postcode.trim() }],
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return new Response(
          JSON.stringify({ error: 'Failed to update postcode', details: text }),
          { status: res.status, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (body.tags && body.tags.length > 0) {
      const getRes = await beehiivFetch(
        `/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`
      );

      if (!getRes.ok) {
        const text = await getRes.text();
        return new Response(
          JSON.stringify({ error: 'Subscriber not found', details: text }),
          { status: getRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const subscriptionBody = (await getRes.json()) as { data: BeehiivSubscription };
      const subscriptionId = subscriptionBody.data?.id;

      if (!subscriptionId) {
        return new Response(JSON.stringify({ error: 'Subscriber not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tagRes = await beehiivFetch(
        `/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
        {
          method: 'POST',
          body: JSON.stringify({ tags: body.tags }),
        }
      );

      if (!tagRes.ok) {
        const text = await tagRes.text();
        return new Response(
          JSON.stringify({ error: 'Failed to add tags', details: text }),
          { status: tagRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
