import Module, { registerHooks } from 'node:module';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') {
      return {
        url: 'data:text/javascript,export {}',
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

const loaded = (Module as unknown as { _load: (request: string, parent: unknown, isMain: boolean) => unknown })._load.bind(
  Module,
);
(Module as unknown as { _load: typeof loaded })._load = (request, parent, isMain) => {
  if (request === 'server-only') return {};
  return loaded(request, parent, isMain);
};

type EnquiryModule = typeof import('./advertising-enquiry');
type AdvertisingModule = typeof import('./advertising');

let enquiry: EnquiryModule;
let advertising: AdvertisingModule;

before(async () => {
  enquiry = await import('./advertising-enquiry');
  advertising = await import('./advertising');
});

const validEnquiry = {
  name: 'Alex Reader',
  email: 'alex@example.com',
  businessName: 'Harbour Cafe',
  goal: 'opening' as const,
  packageId: 'newsletter-feature' as const,
  details: 'Opening on Beaumont Street.',
  source: 'work' as const,
};

describe('advertising enquiry validation', () => {
  it('accepts a complete enquiry', () => {
    const result = advertising.validateAdvertisingEnquiry(validEnquiry);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.enquiry.email, 'alex@example.com');
  });

  it('rejects a missing email before any other work', () => {
    const result = advertising.validateAdvertisingEnquiry({ ...validEnquiry, email: 'not-an-email' });
    assert.equal(result.ok, false);
  });

  it('keeps the advertising option chosen with the enquiry', () => {
    const packages = [
      ['newsletter-feature', 'Newsletter Feature'],
      ['sponsored-article', 'Sponsored Article'],
      ['launch-package', 'Launch Package'],
      ['category-sponsorship', 'Category Sponsorship'],
      ['monthly-partner', 'Monthly Partner'],
      ['ongoing', 'Ongoing Advertising'],
      ['campaigns', 'Campaigns & Partnerships'],
      ['partnership', 'Long-term partnership'],
      ['unsure', 'Not sure yet'],
    ] as const;
    for (const [packageId, label] of packages) {
      const result = advertising.validateAdvertisingEnquiry({ ...validEnquiry, packageId });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.enquiry.packageId, packageId);
        assert.equal(advertising.packageLabel(result.enquiry.packageId), label);
      }
    }
  });
});

describe('advertising acknowledgement', () => {
  it('uses the requested subject and first name', () => {
    const email = enquiry.acknowledgementEmail('Alex');
    assert.equal(email.subject, "We've received your Newcastle Digest enquiry");
    assert.match(email.text, /^Hi Alex,/);
    assert.match(email.text, /We've received your enquiry and will reply by email within one business day/);
    assert.match(email.text, /Cheers,\nNewcastle Digest$/);
  });
});

describe('sponsorship pipeline selection', () => {
  it('uses the existing Sponsorships pipeline and its first stage', () => {
    const selected = enquiry.selectSponsorshipPipeline([
      {
        id: 'other',
        label: 'Sales',
        stages: [{ id: 'new', displayOrder: 0 }],
      },
      {
        id: 'sponsorships',
        label: 'Newcastle Digest Sponsorships',
        stages: [
          { id: 'later', displayOrder: 2 },
          { id: 'first', displayOrder: 0 },
        ],
      },
    ]);
    assert.deepEqual(selected, { pipelineId: 'sponsorships', stageId: 'first' });
  });

  it('does not invent a pipeline when the name is missing', () => {
    assert.equal(enquiry.selectSponsorshipPipeline([]), null);
  });
});

describe('open enquiry matching', () => {
  const newsletter = {
    id: 'deal-open',
    pipelineId: 'pipe-1',
    stageId: 'stage-open',
    name: 'Harbour Cafe — Newsletter Feature',
    description: 'Option: Newsletter Feature',
  };

  it('reuses an open deal for the same product', () => {
    const match = enquiry.findOpenEnquiryDeal([newsletter], {
      pipelineId: 'pipe-1',
      packageLabel: 'Newsletter Feature',
      closedStageIds: new Set(['stage-closed']),
    });
    assert.equal(match, 'deal-open');
  });

  it('allows another deal when the earlier one is closed, the product differs, or it is on another pipeline', () => {
    const query = {
      pipelineId: 'pipe-1',
      packageLabel: 'Newsletter Feature',
      closedStageIds: new Set(['stage-closed']),
    };
    assert.equal(
      enquiry.findOpenEnquiryDeal([{ ...newsletter, stageId: 'stage-closed' }], query),
      null,
    );
    assert.equal(
      enquiry.findOpenEnquiryDeal(
        [{ ...newsletter, description: 'Option: Sponsored Article', name: 'Harbour Cafe — Sponsored Article' }],
        query,
      ),
      null,
    );
    assert.equal(
      enquiry.findOpenEnquiryDeal([{ ...newsletter, pipelineId: 'other-pipe' }], query),
      null,
    );
  });
});

describe('submitAdvertisingEnquiry', () => {
  it('creates a deal on the Sponsorships pipeline and only succeeds after email is accepted', async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.includes('/associations/deals')) return json({ results: [] });
      if (url.endsWith('/crm/v3/objects/contacts/search')) {
        return json({ results: [{ id: 'contact-1' }] });
      }
      if (url.endsWith('/crm/v3/pipelines/deals')) {
        return json({
          results: [
            {
              id: 'pipe-1',
              label: 'Newcastle Digest Sponsorships',
              stages: [{ id: 'stage-1', displayOrder: 0 }],
            },
          ],
        });
      }
      if (url.endsWith('/crm/v3/objects/deals')) {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.properties.pipeline, 'pipe-1');
        assert.equal(body.properties.dealstage, 'stage-1');
        assert.equal(body.properties.dealname, 'Harbour Cafe — Newsletter Feature');
        assert.equal(body.properties.amount, undefined);
        assert.equal(body.properties.hubspot_owner_id, undefined);
        assert.equal(body.associations[0].to.id, 'contact-1');
        return json({ id: 'deal-1' });
      }
      if (url.endsWith('/crm/v3/objects/notes')) {
        return json({ id: 'note-1' });
      }
      if (url === 'https://api.resend.com/emails') {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.subject, "We've received your Newcastle Digest enquiry");
        assert.equal(body.to[0], 'alex@example.com');
        return json({ id: 'email-1' });
      }
      return json({ message: 'unexpected' }, 500);
    };

    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {
      HUBSPOT_ACCESS_TOKEN: 'token',
      RESEND_API_KEY: 're_test',
    }, fetchImpl);

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.filter((call) => call.includes('api.resend.com')).length, 1);
    assert.equal(calls.some((call) => call.startsWith('POST https://api.hubapi.com/crm/v3/pipelines')), false);
  });

  it('does not claim success when the confirmation email is rejected', async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('/associations/deals')) return json({ results: [] });
      if (url.endsWith('/contacts/search')) return json({ results: [{ id: 'contact-1' }] });
      if (url.endsWith('/pipelines/deals')) {
        return json({
          results: [{ id: 'pipe-1', label: 'Newcastle Digest Sponsorships', stages: [{ id: 'stage-1', displayOrder: 0 }] }],
        });
      }
      if (url.endsWith('/deals')) return json({ id: 'deal-1' });
      if (url.endsWith('/notes')) return json({ id: 'note-1' });
      return json({ message: 'rejected' }, 422);
    };

    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {
      HUBSPOT_ACCESS_TOKEN: 'token',
      RESEND_API_KEY: 're_test',
    }, fetchImpl);

    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /confirmation email/);
  });

  it('does not call HubSpot when it is not configured', async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return json({});
    };
    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {}, fetchImpl);
    assert.equal(result.ok, false);
    assert.equal(called, false);
  });

  it('emails the configured operator once, with a link to the saved deal', async () => {
    const emails: { to: string[]; subject: string; text: string; reply_to?: string }[] = [];
    const result = await enquiry.submitAdvertisingEnquiry(
      validEnquiry,
      {
        HUBSPOT_ACCESS_TOKEN: 'token',
        RESEND_API_KEY: 're_test',
        SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
      },
      async (input, init) => {
        const url = String(input);
        if (url.endsWith('/account-info/v3/details')) return json({ portalId: 24601 });
        if (url === 'https://api.resend.com/emails') {
          emails.push(JSON.parse(String(init?.body)));
          return json({ id: `email-${emails.length}` });
        }
        return savedEnquiry(url, init);
      },
    );

    assert.deepEqual(result, { ok: true });
    assert.equal(emails.length, 2);
    assert.deepEqual(emails[0]?.to, ['alex@example.com']);
    const internal = emails[1];
    assert.deepEqual(internal?.to, ['kyle@newcastledigest.com']);
    assert.equal(internal?.subject, 'New advertising enquiry: Harbour Cafe — Newsletter Feature');
    assert.match(internal?.text ?? '', /Contact: Alex Reader/);
    assert.match(internal?.text ?? '', /Email: alex@example.com/);
    assert.match(internal?.text ?? '', /Advertising: Newsletter Feature/);
    assert.match(internal?.text ?? '', /Promoting: A new opening or launch/);
    assert.match(internal?.text ?? '', /Notes: Opening on Beaumont Street\./);
    assert.match(internal?.text ?? '', /https:\/\/app\.hubspot\.com\/contacts\/24601\/record\/0-3\/deal-1/);
    assert.equal(internal?.reply_to, 'alex@example.com');
  });

  it('still notifies the operator when the acknowledgement email is rejected', async () => {
    const recipients: string[][] = [];
    const result = await enquiry.submitAdvertisingEnquiry(
      validEnquiry,
      {
        HUBSPOT_ACCESS_TOKEN: 'token',
        RESEND_API_KEY: 're_test',
        SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
      },
      async (input, init) => {
        const url = String(input);
        if (url.endsWith('/account-info/v3/details')) return json({ portalId: 24601 });
        if (url === 'https://api.resend.com/emails') {
          const body = JSON.parse(String(init?.body)) as { to: string[] };
          recipients.push(body.to);
          if (body.to[0] === 'alex@example.com') return json({ message: 'rejected' }, 422);
          return json({ id: 'internal-1' });
        }
        return savedEnquiry(url, init);
      },
    );

    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /confirmation email/);
    assert.deepEqual(recipients, [['alex@example.com'], ['kyle@newcastledigest.com']]);
  });

  it('keeps a successful enquiry when the operator notification is rejected', async () => {
    const result = await enquiry.submitAdvertisingEnquiry(
      validEnquiry,
      {
        HUBSPOT_PRIVATE_APP_TOKEN: 'private-token',
        RESEND_API_KEY: 're_test',
        SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
      },
      async (input, init) => {
        const url = String(input);
        if (url.endsWith('/account-info/v3/details')) return json({ portalId: 24601 });
        if (url === 'https://api.resend.com/emails') {
          const body = JSON.parse(String(init?.body)) as { to: string[] };
          if (body.to[0] === 'kyle@newcastledigest.com') return json({ message: 'rejected' }, 422);
          return json({ id: 'email-1' });
        }
        return savedEnquiry(url, init);
      },
    );

    assert.deepEqual(result, { ok: true });
  });

  it('does not create or email again when the same product already has an open deal', async () => {
    const calls: string[] = [];
    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {
      HUBSPOT_ACCESS_TOKEN: 'token',
      RESEND_API_KEY: 're_test',
      SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
    }, async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.includes('/associations/deals')) return json({ results: [{ toObjectId: 'deal-open' }] });
      if (url.endsWith('/deals/batch/read')) {
        return json({
          results: [{
            id: 'deal-open',
            properties: {
              dealname: 'Harbour Cafe — Newsletter Feature',
              dealstage: 'stage-1',
              pipeline: 'pipe-1',
              description: 'Option: Newsletter Feature',
            },
          }],
        });
      }
      return savedEnquiry(url, init);
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.some((call) => call.startsWith('POST') && call.endsWith('/crm/v3/objects/deals')), false);
    assert.equal(calls.some((call) => call.includes('api.resend.com')), false);
    assert.equal(calls.some((call) => call.includes('/notes')), false);
  });

  it('reuses a Prospecting deal when that stage is open', async () => {
    const calls: string[] = [];
    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {
      HUBSPOT_ACCESS_TOKEN: 'token',
      RESEND_API_KEY: 're_test',
      SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
    }, async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.includes('/associations/deals')) return json({ results: [{ toObjectId: 'deal-prospecting' }] });
      if (url.endsWith('/deals/batch/read')) {
        return json({
          results: [{
            id: 'deal-prospecting',
            properties: {
              dealname: 'Harbour Cafe — Newsletter Feature',
              dealstage: 'appointmentscheduled',
              pipeline: 'default',
              description: 'Option: Newsletter Feature',
            },
          }],
        });
      }
      if (url.endsWith('/pipelines/deals')) {
        return json({
          results: [{
            id: 'default',
            label: 'Newcastle Digest Sponsorships',
            stages: [
              { id: 'appointmentscheduled', displayOrder: 0, metadata: { isClosed: 'false', probability: '0.2' } },
              { id: 'closedlost', displayOrder: 6, metadata: { isClosed: 'true', probability: '0.0' } },
            ],
          }],
        });
      }
      return savedEnquiry(url, init);
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.some((call) => call.startsWith('POST') && call.endsWith('/crm/v3/objects/deals')), false);
    assert.equal(calls.some((call) => call.includes('api.resend.com')), false);
  });

  it('creates a new deal when the earlier enquiry for that product is closed', async () => {
    let created = false;
    const result = await enquiry.submitAdvertisingEnquiry(validEnquiry, {
      HUBSPOT_ACCESS_TOKEN: 'token',
      RESEND_API_KEY: 're_test',
    }, async (input, init) => {
      const url = String(input);
      if (url.includes('/associations/deals')) return json({ results: [{ toObjectId: 'deal-old' }] });
      if (url.endsWith('/deals/batch/read')) {
        return json({
          results: [{
            id: 'deal-old',
            properties: {
              dealname: 'Harbour Cafe — Newsletter Feature',
              dealstage: 'stage-closed',
              pipeline: 'pipe-1',
              description: 'Option: Newsletter Feature',
            },
          }],
        });
      }
      if (url.endsWith('/pipelines/deals')) {
        return json({
          results: [{
            id: 'pipe-1',
            label: 'Newcastle Digest Sponsorships',
            stages: [
              { id: 'stage-1', displayOrder: 0, metadata: { isClosed: 'false' } },
              { id: 'stage-closed', displayOrder: 3, metadata: { isClosed: 'true' } },
            ],
          }],
        });
      }
      if (url.endsWith('/crm/v3/objects/deals')) {
        created = true;
        return json({ id: 'deal-new' });
      }
      if (url === 'https://api.resend.com/emails') return json({ id: 'email-1' });
      return savedEnquiry(url, init);
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(created, true);
  });
});

function savedEnquiry(url: string, init: RequestInit | undefined): Response {
  if (url.includes('/associations/deals')) return json({ results: [] });
  if (url.endsWith('/contacts/search')) return json({ results: [{ id: 'contact-1' }] });
  if (url.endsWith('/pipelines/deals')) {
    return json({
      results: [{ id: 'pipe-1', label: 'Newcastle Digest Sponsorships', stages: [{ id: 'stage-1', displayOrder: 0 }] }],
    });
  }
  if (url.endsWith('/deals')) {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.properties.hubspot_owner_id, undefined);
    return json({ id: 'deal-1' });
  }
  if (url.endsWith('/notes')) return json({ id: 'note-1' });
  return json({ message: 'unexpected' }, 500);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
