import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { beehiivEmbedUrl, thankYouPath } from './beehiiv-embed';
import {
  createSubmitGate,
  defaultThankYouProgress,
  endScreenAudience,
  parseThankYouProgress,
  requestForSave,
  runProfileSave,
  saveSubscriberProfile,
  serializeThankYouProgress,
  type ThankYouProgress,
} from './thank-you-profile';

const EMAIL = 'ada@example.com';

function progress(patch: Partial<ThankYouProgress> = {}): ThankYouProgress {
  return { ...defaultThankYouProgress(), ...patch };
}

describe('business answer', () => {
  it('saves yes immediately for a business owner', () => {
    assert.deepEqual(requestForSave('business', progress({ business: 'yes' }), EMAIL), {
      action: 'save',
      body: { email: EMAIL, runs_business: 'yes' },
    });
    assert.equal(endScreenAudience('yes'), 'business');
  });

  it('saves no for a general reader', () => {
    assert.deepEqual(requestForSave('business', progress({ business: 'no' }), EMAIL), {
      action: 'save',
      body: { email: EMAIL, runs_business: 'no' },
    });
    assert.equal(endScreenAudience('no'), 'reader');
  });

  it('skips without sending a business status', () => {
    assert.deepEqual(requestForSave('business', progress({ business: 'skip' }), EMAIL), {
      action: 'skip',
    });
    assert.equal(endScreenAudience('skip'), 'reader');
  });
});

describe('postcode answer', () => {
  it('saves a postcode on its own', () => {
    assert.deepEqual(requestForSave('postcode', progress({ postcode: ' 2300 ' }), EMAIL), {
      action: 'save',
      body: { email: EMAIL, postcode: '2300' },
    });
  });

  it('continues without saving when postcode is empty', () => {
    assert.deepEqual(requestForSave('postcode', progress({ postcode: '   ' }), EMAIL), {
      action: 'skip',
    });
  });
});

describe('interest ranking', () => {
  it('saves the full default order and the original top three tags', () => {
    const interestIds = defaultThankYouProgress().interestIds;
    assert.deepEqual(requestForSave('ranking', progress({ interestIds }), EMAIL), {
      action: 'save',
      body: {
        email: EMAIL,
        interests: interestIds,
        tags: ['food-drink', 'events-nightlife', 'live-music-gigs'],
      },
    });
  });

  it('saves a changed order and the new top three tags', () => {
    const interestIds = [...defaultThankYouProgress().interestIds].reverse();
    const request = requestForSave('ranking', progress({ interestIds }), EMAIL);
    assert.equal(request.action, 'save');
    if (request.action !== 'save') return;
    assert.deepEqual(request.body.interests, interestIds);
    assert.deepEqual(request.body.tags, interestIds.slice(0, 3));
    assert.equal((request.body.interests as string[]).length, 6);
  });
});

describe('saveSubscriberProfile', () => {
  it('treats a failed field as unsuccessful', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          ok: false,
          fields: {
            postcode: { ok: false, error: 'Could not update postcode' },
            tags: { ok: true },
          },
        }),
        { status: 422 },
      );
    const result = await saveSubscriberProfile({ email: EMAIL, postcode: '2300' }, fetchImpl);
    assert.deepEqual(result, { ok: false });
  });

  it('accepts a response only when every field succeeded', async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ ok: true, fields: { postcode: { ok: true } } }), { status: 200 });
    const result = await saveSubscriberProfile({ email: EMAIL, postcode: '2300' }, fetchImpl);
    assert.deepEqual(result, { ok: true });
  });
});

describe('missing email', () => {
  it('does not build a save request or call the API', async () => {
    let called = false;
    const request = requestForSave('business', progress({ business: 'yes' }), null);
    assert.deepEqual(request, { action: 'missing-email' });
    const outcome = await runProfileSave('business', request, createSubmitGate(), async () => {
      called = true;
      return { ok: true };
    });
    assert.equal(outcome, 'missing-email');
    assert.equal(called, false);
  });
});

describe('refresh', () => {
  it('restores the step, answers, and failed saves', () => {
    const interestIds = [...defaultThankYouProgress().interestIds].reverse();
    const stored = progress({
      step: 2,
      business: 'yes',
      postcode: '2290',
      interestIds,
      failed: ['business'],
      missingEmail: false,
    });
    const parsed = parseThankYouProgress(serializeThankYouProgress(stored));
    assert.deepEqual(parsed, stored);
    assert.equal(JSON.stringify(parsed).includes(EMAIL), false);
  });
});

describe('repeated clicks', () => {
  it('does not send a second request while the first is still running', async () => {
    let calls = 0;
    let release: (value: { ok: true }) => void = () => {};
    const gate = createSubmitGate();
    const save = () => {
      calls += 1;
      return new Promise<{ ok: true }>((resolve) => {
        release = resolve;
      });
    };
    const request = requestForSave('business', progress({ business: 'yes' }), EMAIL);
    const first = runProfileSave('business', request, gate, save);
    const second = await runProfileSave('business', request, gate, save);
    assert.equal(second, 'duplicate');
    assert.equal(calls, 1);
    release({ ok: true });
    assert.equal(await first, 'saved');
  });
});

describe('signup entry points', () => {
  it('still sends new subscribers to the thank-you page without an email', () => {
    assert.equal(thankYouPath('subscribe_page'), '/thank-you?src=subscribe_page');
    assert.equal(thankYouPath('homepage').includes('email'), false);
    const embed = beehiivEmbedUrl('homepage');
    assert.equal(embed.includes('embeds.beehiiv.com/e1030bd0-e867-42b4-b64e-c3b75defc0d9'), true);
    assert.equal(embed.includes('redirect_to='), true);
    assert.equal(decodeURIComponent(embed).includes('/thank-you?src=homepage'), true);
  });
});
