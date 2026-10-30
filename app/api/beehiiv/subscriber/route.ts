/**
 * POST /api/beehiiv/subscriber
 * Partially updates postcode, runs_business, interests, and/or top-three tags.
 * Body: { email, postcode?, runs_business?: "yes" | "no", interests?: string[], tags?: string[] }
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import {
  handleSubscriberUpdate,
  readBeehiivResponse,
  type BeehiivClient,
} from '@/lib/beehiiv-subscriber';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function createBeehiivClient(apiKey: string): BeehiivClient {
  return async (call) => {
    const res = await fetch(`${BEEHIIV_API}${call.path}`, {
      method: call.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...(call.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: call.body === undefined ? undefined : JSON.stringify(call.body),
    });
    return readBeehiivResponse(res.status, await res.text());
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const apiKey = process.env.BEEHIIV_API_KEY?.trim();
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID?.trim();
  if (!apiKey || !publicationId) {
    return json({ error: 'Server configuration error' }, 500);
  }

  const result = await handleSubscriberUpdate(body, {
    publicationId,
    client: createBeehiivClient(apiKey),
  });
  return json(result.body, result.status);
}
