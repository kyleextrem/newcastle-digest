import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { POST } from './route';

const PUBLICATION_ID = 'pub_00000000-0000-0000-0000-000000000000';
const API_KEY = 'test-beehiiv-key';
const EMAIL = 'ada@example.com';
const SUBSCRIPTION_ID = 'sub_00000000-0000-0000-0000-000000000000';
const TOP_THREE = ['food-drink', 'events-nightlife', 'live-music-gigs'];

type CapturedCall = {
  url: string;
  method: string;
  body: string | undefined;
  authorization: string | null;
};

const originalFetch = globalThis.fetch;
const originalKey = process.env.BEEHIIV_API_KEY;
const originalPublication = process.env.BEEHIIV_PUBLICATION_ID;

function savedBody() {
  return JSON.stringify({ data: { id: SUBSCRIPTION_ID, email: EMAIL } });
}

function installFetch(
  respond: (call: CapturedCall) => { status: number; body: string },
): CapturedCall[] {
  const calls: CapturedCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: CapturedCall = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : undefined,
      authorization: new Headers(init?.headers).get('authorization'),
    };
    calls.push(call);
    const response = respond(call);
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return calls;
}

function post(body: unknown) {
  return POST(
    new Request('https://www.newcastledigest.com/api/beehiiv/subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.BEEHIIV_API_KEY;
  else process.env.BEEHIIV_API_KEY = originalKey;
  if (originalPublication === undefined) delete process.env.BEEHIIV_PUBLICATION_ID;
  else process.env.BEEHIIV_PUBLICATION_ID = originalPublication;
});

describe('POST /api/beehiiv/subscriber', () => {
  it('accepts the current thank-you payload and only adds the top three tags', async () => {
    process.env.BEEHIIV_API_KEY = API_KEY;
    process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION_ID;
    const calls = installFetch(() => ({ status: 200, body: savedBody() }));

    const response = await post({
      email: '  Ada@Example.com  ',
      postcode: '2300',
      tags: TOP_THREE,
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      ok: true,
      fields: {
        postcode: { ok: true },
        tags: { ok: true },
      },
    });
    assert.deepEqual(
      calls.map((call) => call.method),
      ['PUT', 'GET', 'POST'],
    );
    assert.equal(calls.some((call) => call.method === 'DELETE'), false);
    assert.equal(calls[0].url.endsWith('/by_email/ada%40example.com'), true);
    assert.equal(calls[0].body, JSON.stringify({
      custom_fields: [{ name: 'postcode', value: '2300' }],
    }));
    assert.equal(calls[2].url.endsWith(`/subscriptions/${SUBSCRIPTION_ID}/tags`), true);
    assert.equal(calls[2].body, JSON.stringify({ tags: TOP_THREE }));
    assert.equal(calls.every((call) => call.authorization === `Bearer ${API_KEY}`), true);
    assert.equal(JSON.stringify(payload).includes(API_KEY), false);
    assert.equal(JSON.stringify(payload).includes('runs_business'), false);
    assert.equal(JSON.stringify(payload).includes('interests'), false);
  });

  it('still updates tags when the postcode request fails, without returning the upstream body', async () => {
    process.env.BEEHIIV_API_KEY = API_KEY;
    process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION_ID;
    const calls = installFetch((call) => {
      if (call.method === 'PUT' && call.body?.includes('"postcode"')) {
        return {
          status: 500,
          body: JSON.stringify({ errors: [{ message: 'upstream secret sk_live_should_not_leak' }] }),
        };
      }
      return { status: 200, body: savedBody() };
    });

    const response = await post({
      email: EMAIL,
      postcode: '2300',
      tags: TOP_THREE,
    });
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    assert.equal(response.status, 422);
    assert.equal(payload.ok, false);
    assert.equal(payload.fields.postcode.ok, false);
    assert.equal(payload.fields.tags.ok, true);
    assert.equal(calls.map((call) => call.method).includes('POST'), true);
    assert.equal(serialized.includes('sk_live_should_not_leak'), false);
    assert.equal(serialized.includes(API_KEY), false);
  });

  it('reports a beehiiv warning as a failed field and hides the warning text', async () => {
    process.env.BEEHIIV_API_KEY = API_KEY;
    process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION_ID;
    installFetch(() => ({
      status: 200,
      body: JSON.stringify({
        data: { id: SUBSCRIPTION_ID },
        warnings: [{ message: 'Unknown custom field was dropped', code: 'CUSTOM_FIELD' }],
      }),
    }));

    const response = await post({ email: EMAIL, postcode: '2300' });
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    assert.equal(response.status, 422);
    assert.deepEqual(payload, {
      ok: false,
      fields: {
        postcode: { ok: false, error: 'Beehiiv did not save postcode' },
      },
    });
    assert.equal(serialized.includes('dropped'), false);
    assert.equal(serialized.includes('CUSTOM_FIELD'), false);
  });

  it('rejects an invalid email before calling beehiiv', async () => {
    process.env.BEEHIIV_API_KEY = API_KEY;
    process.env.BEEHIIV_PUBLICATION_ID = PUBLICATION_ID;
    const calls = installFetch(() => ({ status: 200, body: savedBody() }));

    const response = await post({ email: 'not-an-email', postcode: '2300', tags: TOP_THREE });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'A valid email is required' });
    assert.equal(calls.length, 0);
  });

  it('does not call beehiiv when the server is not configured', async () => {
    delete process.env.BEEHIIV_API_KEY;
    delete process.env.BEEHIIV_PUBLICATION_ID;
    const calls = installFetch(() => ({ status: 200, body: savedBody() }));

    const response = await post({ email: EMAIL, postcode: '2300', tags: TOP_THREE });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Server configuration error' });
    assert.equal(calls.length, 0);
  });
});
