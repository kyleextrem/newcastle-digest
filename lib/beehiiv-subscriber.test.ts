import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_INTERESTS } from '../app/thank-you/constants';
import {
  ALLOWED_INTEREST_IDS,
  handleSubscriberUpdate,
  readBeehiivResponse,
  type BeehiivCall,
  type BeehiivClient,
  type BeehiivResult,
  type SubscriberUpdateResult,
} from './beehiiv-subscriber';

const PUBLICATION_ID = 'pub_00000000-0000-0000-0000-000000000000';
const EMAIL = 'ada@example.com';
const SUBSCRIPTION_ID = 'sub_00000000-0000-0000-0000-000000000000';

const RANKING = [
  'fitness-outdoors',
  'arts-culture',
  'markets-shopping',
  'live-music-gigs',
  'events-nightlife',
  'food-drink',
] as const;

function savedSubscription(): BeehiivResult {
  return {
    ok: true,
    status: 200,
    body: { data: { id: SUBSCRIPTION_ID, email: EMAIL } },
  };
}

function callsOf(client: BeehiivClient & { calls: BeehiivCall[] }) {
  return client.calls;
}

function recordingClient(
  respond: (call: BeehiivCall) => BeehiivResult | Promise<BeehiivResult>,
): BeehiivClient & { calls: BeehiivCall[] } {
  const calls: BeehiivCall[] = [];
  const client: BeehiivClient & { calls: BeehiivCall[] } = async (call) => {
    calls.push(call);
    return respond(call);
  };
  client.calls = calls;
  return client;
}

function update(
  body: unknown,
  client: BeehiivClient,
  publicationId: string | undefined = PUBLICATION_ID,
): Promise<SubscriberUpdateResult> {
  return handleSubscriberUpdate(body, { publicationId, client });
}

function customFieldNames(call: BeehiivCall): string[] {
  const body = call.body as { custom_fields?: { name?: string }[] } | undefined;
  return (body?.custom_fields ?? []).map((field) => field.name ?? '');
}

describe('allowed interests', () => {
  it('matches the thank-you ranking ids and tags', () => {
    assert.deepEqual(
      DEFAULT_INTERESTS.map((item) => item.id),
      [...ALLOWED_INTEREST_IDS],
    );
    assert.deepEqual(
      DEFAULT_INTERESTS.map((item) => item.tag),
      [...ALLOWED_INTEREST_IDS],
    );
  });
});

describe('handleSubscriberUpdate validation', () => {
  it('rejects a missing or invalid email before calling beehiiv', async () => {
    const client = recordingClient(() => savedSubscription());
    for (const email of [undefined, '', '   ', 'not-an-email', 'a@b', 12]) {
      const result = await update({ email }, client);
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: 'A valid email is required' });
    }
    assert.equal(callsOf(client).length, 0);
  });

  it('rejects a business status other than yes or no', async () => {
    const client = recordingClient(() => savedSubscription());
    for (const runs_business of ['YES', 'maybe', '', true, null]) {
      const result = await update({ email: EMAIL, runs_business }, client);
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: 'runs_business must be yes or no' });
    }
    assert.equal(callsOf(client).length, 0);
  });

  it('rejects unknown interest identifiers and tags', async () => {
    const client = recordingClient(() => savedSubscription());
    const unknownInterest = await update(
      { email: EMAIL, interests: ['food-drink', 'live-music'] },
      client,
    );
    const unknownTag = await update({ email: EMAIL, tags: ['business-owner'] }, client);
    assert.equal(unknownInterest.status, 400);
    assert.deepEqual(unknownInterest.body, { error: 'Unknown interest' });
    assert.equal(unknownTag.status, 400);
    assert.deepEqual(unknownTag.body, { error: 'Unknown tag' });
    assert.equal(callsOf(client).length, 0);
  });

  it('does not call beehiiv when the request has no update fields', async () => {
    const client = recordingClient(() => savedSubscription());
    const omitted = await update({ email: `  ${EMAIL.toUpperCase()}  ` }, client);
    const blank = await update({ email: EMAIL, postcode: '   ', tags: [] }, client);
    assert.equal(omitted.status, 200);
    assert.deepEqual(omitted.body, { ok: true, fields: {} });
    assert.equal(blank.status, 200);
    assert.deepEqual(blank.body, { ok: true, fields: {} });
    assert.equal(callsOf(client).length, 0);
  });
});

describe('handleSubscriberUpdate writes', () => {
  it('updates postcode alone and does not send omitted fields', async () => {
    const client = recordingClient(() => savedSubscription());
    const result = await update({ email: '  Ada@Example.com  ', postcode: ' 2300 ' }, client);
    const calls = callsOf(client);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, fields: { postcode: { ok: true } } });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'PUT');
    assert.equal(calls[0].path.endsWith('/by_email/ada%40example.com'), true);
    assert.deepEqual(calls[0].body, {
      custom_fields: [{ name: 'postcode', value: '2300' }],
    });
    assert.equal(JSON.stringify(calls).includes('runs_business'), false);
    assert.equal(JSON.stringify(calls).includes('interests'), false);
    assert.equal(JSON.stringify(calls).includes('"delete"'), false);
  });

  it('accepts the current thank-you payload of postcode plus top-three tags', async () => {
    const tags = ['food-drink', 'events-nightlife', 'live-music-gigs'];
    const client = recordingClient((call) => {
      if (call.method === 'GET') return savedSubscription();
      return savedSubscription();
    });
    const result = await update({ email: EMAIL, postcode: '2300', tags }, client);
    const calls = callsOf(client);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
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
    assert.equal(
      calls.some((call) => customFieldNames(call).includes('runs_business')),
      false,
    );
    assert.equal(
      calls.some((call) => customFieldNames(call).includes('interests')),
      false,
    );
    assert.deepEqual(calls.find((call) => call.method === 'POST')?.body, { tags });
  });

  it('updates business status alone', async () => {
    const client = recordingClient(() => savedSubscription());
    const result = await update({ email: EMAIL, runs_business: 'no' }, client);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, fields: { runs_business: { ok: true } } });
    assert.deepEqual(callsOf(client)[0].body, {
      custom_fields: [{ name: 'runs_business', value: 'no' }],
    });
    assert.deepEqual(customFieldNames(callsOf(client)[0]), ['runs_business']);
  });

  it('saves an interest ranking alone, in the submitted order', async () => {
    const client = recordingClient(() => savedSubscription());
    const result = await update({ email: EMAIL, interests: [...RANKING] }, client);

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, fields: { interests: { ok: true } } });
    assert.equal(callsOf(client).length, 1);
    assert.deepEqual(callsOf(client)[0].body, {
      custom_fields: [{ name: 'interests', value: RANKING.join(',') }],
    });
  });

  it('saves the full ranking and appends the top three tags without deleting tags', async () => {
    const topThree = RANKING.slice(0, 3);
    const client = recordingClient((call) => {
      if (call.method === 'GET') return savedSubscription();
      return savedSubscription();
    });
    const result = await update(
      { email: EMAIL, interests: [...RANKING], tags: [...topThree] },
      client,
    );
    const calls = callsOf(client);
    const methods = calls.map((call) => call.method);
    const tagWrite = calls.find((call) => call.path.endsWith('/tags'));

    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      ok: true,
      fields: {
        interests: { ok: true },
        tags: { ok: true },
      },
    });
    assert.deepEqual(methods, ['PUT', 'GET', 'POST']);
    assert.equal(tagWrite?.method, 'POST');
    assert.deepEqual(tagWrite?.body, { tags: [...topThree] });
    assert.equal(
      calls.some((call) => customFieldNames(call).includes('interests')),
      true,
    );
    assert.equal(JSON.stringify(calls).includes('"delete"'), false);
  });

  it('still attempts business status and interests when postcode fails', async () => {
    const client = recordingClient((call) => {
      const names = customFieldNames(call);
      if (names.includes('postcode')) {
        return {
          ok: false,
          status: 500,
          body: { errors: [{ message: 'upstream sk_live_should_not_leak' }] },
        };
      }
      return savedSubscription();
    });
    const result = await update(
      {
        email: EMAIL,
        postcode: '2300',
        runs_business: 'yes',
        interests: [...RANKING],
      },
      client,
    );

    assert.equal(result.status, 422);
    assert.deepEqual(result.body, {
      ok: false,
      fields: {
        postcode: { ok: false, error: 'Could not update postcode' },
        runs_business: { ok: true },
        interests: { ok: true },
      },
    });
    assert.equal(callsOf(client).length, 3);
    assert.equal(JSON.stringify(result).includes('sk_live_should_not_leak'), false);
  });

  it('reports a custom field as unsuccessful when beehiiv returns warnings', async () => {
    const client = recordingClient(() => ({
      ok: true,
      status: 200,
      body: {
        data: { id: SUBSCRIPTION_ID },
        warnings: [{ message: 'Unknown custom field was dropped', code: 'CUSTOM_FIELD' }],
      },
    }));
    const result = await update({ email: EMAIL, postcode: '2300', runs_business: 'yes' }, client);

    assert.equal(result.status, 422);
    assert.deepEqual(result.body, {
      ok: false,
      fields: {
        postcode: { ok: false, error: 'Beehiiv did not save postcode' },
        runs_business: { ok: false, error: 'Beehiiv did not save business status' },
      },
    });
    assert.equal(JSON.stringify(result).includes('CUSTOM_FIELD'), false);
    assert.equal(JSON.stringify(result).includes('dropped'), false);
  });

  it('does not call beehiiv when the publication id is unsafe', async () => {
    const client = recordingClient(() => savedSubscription());
    const result = await update({ email: EMAIL, postcode: '2300' }, client, 'pub_../admin');
    assert.equal(result.status, 500);
    assert.deepEqual(result.body, { error: 'Server configuration error' });
    assert.equal(callsOf(client).length, 0);
  });
});

describe('readBeehiivResponse', () => {
  it('drops non-JSON upstream bodies instead of forwarding them', () => {
    const result = readBeehiivResponse(502, 'Bearer secret-token <html>bad gateway</html>');
    assert.equal(result.ok, false);
    assert.equal(result.body, null);
  });
});
