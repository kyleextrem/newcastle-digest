import 'server-only';

import {
  ADVERTISING_PIPELINE_LABEL,
  firstNameFrom,
  goalLabel,
  packageLabel,
  type AdvertisingEnquiryInput,
} from '@/lib/advertising';
import { parseAdminEmails } from '@/lib/shop-admin-policy';
import { shopEmailFromAddress } from '@/lib/shop-email-content';

const HUBSPOT_BASE = 'https://api.hubapi.com';
const RESEND_API = 'https://api.resend.com/emails';
const DEAL_TO_CONTACT = 3;
const NOTE_TO_CONTACT = 202;
const SEND_TIMEOUT_MS = 8_000;

export const ADVERTISING_EMAIL_SUBJECT = "We've received your Newcastle Digest enquiry";

export const ADVERTISING_NOT_ACCEPTED =
  "We couldn't send your enquiry just now. Email kyle@newcastledigest.com and we'll pick it up.";

export type AdvertisingEnquiryResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

type HubspotResult = { ok: true; status: number; json: unknown } | { ok: false; status: number; json: unknown };

type DealPipeline = {
  id: string;
  label: string;
  stages: { id: string; displayOrder: number; closed?: boolean }[];
};

type EnquiryDealRecord = {
  id: string;
  pipelineId: string;
  stageId: string;
  name: string;
  description: string;
};

export function acknowledgementEmail(firstName: string): { subject: string; text: string; html: string } {
  const greeting = firstName.trim() || 'there';
  const text = [
    `Hi ${greeting},`,
    '',
    'Thanks for getting in touch about advertising with Newcastle Digest.',
    '',
    "We've received your enquiry and will reply by email within one business day with more information and next steps.",
    '',
    'Cheers,',
    'Newcastle Digest',
  ].join('\n');

  const html = text
    .split('\n')
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : '<br>'))
    .join('');

  return { subject: ADVERTISING_EMAIL_SUBJECT, text, html };
}

export function hubspotDealUrl(portalId: string, dealId: string): string {
  return `https://app.hubspot.com/contacts/${encodeURIComponent(portalId)}/record/0-3/${encodeURIComponent(dealId)}`;
}

export function internalNotificationEmail(
  enquiry: AdvertisingEnquiryInput,
  dealUrl: string | null,
): { subject: string; text: string; html: string } {
  const lines = [
    'New Newcastle Digest advertising enquiry',
    '',
    `Business: ${enquiry.businessName}`,
    `Contact: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Advertising: ${packageLabel(enquiry.packageId)}`,
    `Promoting: ${goalLabel(enquiry.goal)}`,
    `Notes: ${enquiry.details.trim() || 'None'}`,
    `HubSpot deal: ${dealUrl ?? 'Saved, but the deal link is unavailable.'}`,
  ];
  const text = lines.join('\n');
  const html = lines.map((line) => (line ? `<p>${escapeHtml(line)}</p>` : '<br>')).join('');
  return {
    subject: `New advertising enquiry: ${enquiry.businessName} — ${packageLabel(enquiry.packageId)}`,
    text,
    html,
  };
}

export function findOpenEnquiryDeal(
  deals: readonly EnquiryDealRecord[],
  query: { pipelineId: string; packageLabel: string; closedStageIds: ReadonlySet<string> },
): string | null {
  for (const deal of deals) {
    if (deal.pipelineId !== query.pipelineId) continue;
    if (query.closedStageIds.has(deal.stageId)) continue;
    if (recordedPackageLabel(deal.name, deal.description) !== query.packageLabel) continue;
    return deal.id;
  }
  return null;
}

function recordedPackageLabel(name: string, description: string): string | null {
  const option = description.match(/^Option: (.+)$/m);
  if (option?.[1]) return option[1].trim();
  const marker = ' — ';
  const index = name.lastIndexOf(marker);
  if (index === -1) return null;
  const label = name.slice(index + marker.length).trim();
  return label || null;
}

export function selectSponsorshipPipeline(pipelines: DealPipeline[]): { pipelineId: string; stageId: string } | null {
  const match = pipelines.find(
    (pipeline) => pipeline.label.trim().toLowerCase() === ADVERTISING_PIPELINE_LABEL.toLowerCase(),
  );
  if (!match) return null;
  const stage = [...match.stages].sort((a, b) => a.displayOrder - b.displayOrder)[0];
  if (!stage?.id) return null;
  return { pipelineId: match.id, stageId: stage.id };
}

export async function submitAdvertisingEnquiry(
  enquiry: AdvertisingEnquiryInput,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<AdvertisingEnquiryResult> {
  const token = hubspotAccessToken(env);
  const resendKey = env.RESEND_API_KEY?.trim() ?? '';
  if (!token || !resendKey) {
    console.error('[advertising] HubSpot or Resend is not configured');
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 503 };
  }

  const contact = await upsertContact(enquiry, token, fetchImpl);
  if (!contact.ok) {
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 502 };
  }

  const pipelines = await listDealPipelines(token, fetchImpl);
  if (!pipelines.ok) {
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 502 };
  }

  const selected = selectSponsorshipPipeline(pipelines.pipelines);
  if (!selected) {
    console.error(`[advertising] Pipeline not found: ${ADVERTISING_PIPELINE_LABEL}`);
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 502 };
  }

  const openDeal = await findOpenEnquiryDealForContact(
    contact.id,
    {
      pipelineId: selected.pipelineId,
      packageLabel: packageLabel(enquiry.packageId),
      closedStageIds: closedStageIds(pipelines.pipelines, selected.pipelineId),
    },
    token,
    fetchImpl,
  );
  if (!openDeal.ok) {
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 502 };
  }
  if (openDeal.dealId) {
    return { ok: true };
  }

  const deal = await createDeal(enquiry, selected, contact.id, token, fetchImpl);
  if (!deal.ok) {
    return { ok: false, error: ADVERTISING_NOT_ACCEPTED, status: 502 };
  }

  const note = await createNote(enquiry, contact.id, token, fetchImpl);
  if (!note.ok) {
    console.error('[advertising] Enquiry deal was created but the note was not');
  }

  const email = acknowledgementEmail(firstNameFrom(enquiry.name));
  const sent = await sendAcknowledgement(enquiry.email, email, resendKey, env, fetchImpl);
  await notifyOperator(enquiry, deal.id, token, resendKey, env, fetchImpl);
  if (!sent.ok) {
    console.error('[advertising] Enquiry was saved but the confirmation email failed');
    return {
      ok: false,
      error:
        "We saved your enquiry, but the confirmation email didn't send. You don't need to submit again. We'll still reply.",
      status: 502,
    };
  }

  return { ok: true };
}

async function listDealPipelines(
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; pipelines: DealPipeline[] } | { ok: false }> {
  const result = await hubspot('/crm/v3/pipelines/deals', { method: 'GET' }, token, fetchImpl);
  if (!result.ok) {
    console.error('[advertising] HubSpot pipeline lookup failed', result.status);
    return { ok: false };
  }

  const results = isRecord(result.json) && Array.isArray(result.json.results) ? result.json.results : [];
  const pipelines: DealPipeline[] = [];
  for (const item of results) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.label !== 'string') continue;
    const stages = Array.isArray(item.stages) ? item.stages : [];
    pipelines.push({
      id: item.id,
      label: item.label,
      stages: stages.flatMap((stage) => {
        if (!isRecord(stage) || typeof stage.id !== 'string') return [];
        const displayOrder = typeof stage.displayOrder === 'number' ? stage.displayOrder : 0;
        const metadata = isRecord(stage.metadata) ? stage.metadata : {};
        const closed = metadata.isClosed === true || metadata.isClosed === 'true';
        return [{ id: stage.id, displayOrder, closed }];
      }),
    });
  }
  return { ok: true, pipelines };
}

function closedStageIds(pipelines: readonly DealPipeline[], pipelineId: string): Set<string> {
  const pipeline = pipelines.find((item) => item.id === pipelineId);
  return new Set(pipeline?.stages.filter((stage) => stage.closed).map((stage) => stage.id) ?? []);
}

async function findOpenEnquiryDealForContact(
  contactId: string,
  query: { pipelineId: string; packageLabel: string; closedStageIds: ReadonlySet<string> },
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; dealId: string | null } | { ok: false }> {
  const associated = await listAssociatedDealIds(contactId, token, fetchImpl);
  if (!associated.ok) return { ok: false };
  if (associated.ids.length === 0) return { ok: true, dealId: null };

  const deals = await readDeals(associated.ids, token, fetchImpl);
  if (!deals.ok) return { ok: false };
  return { ok: true, dealId: findOpenEnquiryDeal(deals.deals, query) };
}

async function listAssociatedDealIds(
  contactId: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; ids: string[] } | { ok: false }> {
  const ids: string[] = [];
  let after: string | null = null;

  for (let page = 0; page < 5; page += 1) {
    const path = `/crm/v4/objects/contacts/${encodeURIComponent(contactId)}/associations/deals?limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`;
    const result = await hubspot(path, { method: 'GET' }, token, fetchImpl);
    if (result.status === 404) return { ok: true, ids };
    if (!result.ok) {
      console.error('[advertising] HubSpot deal lookup failed', result.status);
      return { ok: false };
    }

    const results = isRecord(result.json) && Array.isArray(result.json.results) ? result.json.results : [];
    for (const item of results) {
      if (!isRecord(item)) continue;
      const id = item.toObjectId ?? item.id;
      if (typeof id === 'string' || typeof id === 'number') ids.push(String(id));
    }

    const paging = isRecord(result.json) && isRecord(result.json.paging) ? result.json.paging : null;
    const next = paging && isRecord(paging.next) ? paging.next : null;
    after = next && typeof next.after === 'string' ? next.after : null;
    if (!after) break;
  }

  return { ok: true, ids };
}

async function readDeals(
  ids: readonly string[],
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; deals: EnquiryDealRecord[] } | { ok: false }> {
  const deals: EnquiryDealRecord[] = [];

  for (let index = 0; index < ids.length; index += 100) {
    const result = await hubspot(
      '/crm/v3/objects/deals/batch/read',
      {
        method: 'POST',
        body: {
          properties: ['dealname', 'dealstage', 'pipeline', 'description'],
          inputs: ids.slice(index, index + 100).map((id) => ({ id })),
        },
      },
      token,
      fetchImpl,
    );
    if (!result.ok) {
      console.error('[advertising] HubSpot deal lookup failed', result.status);
      return { ok: false };
    }

    const results = isRecord(result.json) && Array.isArray(result.json.results) ? result.json.results : [];
    for (const item of results) {
      if (!isRecord(item) || typeof item.id !== 'string' || !isRecord(item.properties)) continue;
      const properties = item.properties;
      deals.push({
        id: item.id,
        pipelineId: typeof properties.pipeline === 'string' ? properties.pipeline : '',
        stageId: typeof properties.dealstage === 'string' ? properties.dealstage : '',
        name: typeof properties.dealname === 'string' ? properties.dealname : '',
        description: typeof properties.description === 'string' ? properties.description : '',
      });
    }
  }

  return { ok: true, deals };
}

async function upsertContact(
  enquiry: AdvertisingEnquiryInput,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; id: string } | { ok: false }> {
  const existing = await hubspot(
    '/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      body: {
        filterGroups: [
          { filters: [{ propertyName: 'email', operator: 'EQ', value: enquiry.email }] },
        ],
        properties: ['email'],
        limit: 1,
      },
    },
    token,
    fetchImpl,
  );

  if (existing.ok) {
    const results = isRecord(existing.json) && Array.isArray(existing.json.results) ? existing.json.results : [];
    const first = results[0];
    if (isRecord(first) && typeof first.id === 'string') {
      return { ok: true, id: first.id };
    }
  }

  const { firstname, lastname } = splitName(enquiry.name);
  const properties: Record<string, string> = {
    email: enquiry.email,
    firstname,
    company: enquiry.businessName,
  };
  if (lastname) properties.lastname = lastname;

  const created = await hubspot(
    '/crm/v3/objects/contacts',
    { method: 'POST', body: { properties } },
    token,
    fetchImpl,
  );

  if (created.ok && isRecord(created.json) && typeof created.json.id === 'string') {
    return { ok: true, id: created.json.id };
  }

  const message = isRecord(created.json) && typeof created.json.message === 'string' ? created.json.message : '';
  const existingId = message.match(/Existing ID:\s*(\d+)/i)?.[1];
  if (created.status === 409 && existingId) {
    return { ok: true, id: existingId };
  }

  console.error('[advertising] HubSpot contact was not saved', created.status);
  return { ok: false };
}

async function createDeal(
  enquiry: AdvertisingEnquiryInput,
  pipeline: { pipelineId: string; stageId: string },
  contactId: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; id: string } | { ok: false }> {
  const created = await hubspot(
    '/crm/v3/objects/deals',
    {
      method: 'POST',
      body: {
        properties: {
          dealname: `${enquiry.businessName} — ${packageLabel(enquiry.packageId)}`,
          pipeline: pipeline.pipelineId,
          dealstage: pipeline.stageId,
          description: dealDescription(enquiry),
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: DEAL_TO_CONTACT }],
          },
        ],
      },
    },
    token,
    fetchImpl,
  );

  if (!created.ok || !isRecord(created.json) || typeof created.json.id !== 'string') {
    console.error('[advertising] HubSpot deal was not created', created.status);
    return { ok: false };
  }

  return { ok: true, id: created.json.id };
}

async function createNote(
  enquiry: AdvertisingEnquiryInput,
  contactId: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean }> {
  const created = await hubspot(
    '/crm/v3/objects/notes',
    {
      method: 'POST',
      body: {
        properties: {
          hs_timestamp: Date.now().toString(),
          hs_note_body: noteHtml(enquiry),
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_CONTACT }],
          },
        ],
      },
    },
    token,
    fetchImpl,
  );
  return { ok: created.ok };
}

function dealDescription(enquiry: AdvertisingEnquiryInput): string {
  return [
    'Newcastle Digest advertising enquiry',
    `Option: ${packageLabel(enquiry.packageId)}`,
    `Promoting: ${goalLabel(enquiry.goal)}`,
    `Business: ${enquiry.businessName}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Page: /${enquiry.source}`,
    enquiry.details ? `Details: ${enquiry.details}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function noteHtml(enquiry: AdvertisingEnquiryInput): string {
  return dealDescription(enquiry)
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function hubspotAccessToken(env: Record<string, string | undefined>): string {
  return env.HUBSPOT_ACCESS_TOKEN?.trim() || env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() || '';
}

async function notifyOperator(
  enquiry: AdvertisingEnquiryInput,
  dealId: string,
  token: string,
  apiKey: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
): Promise<void> {
  const recipients = parseAdminEmails(env.SHOP_ADMIN_EMAILS);
  if (recipients.length === 0) {
    console.error('[advertising] SHOP_ADMIN_EMAILS is not configured, so no internal notification was sent');
    return;
  }

  const portalId = await readPortalId(token, fetchImpl);
  const dealUrl = portalId ? hubspotDealUrl(portalId, dealId) : null;
  const email = internalNotificationEmail(enquiry, dealUrl);
  const sent = await sendResendEmail(
    { to: recipients, subject: email.subject, text: email.text, html: email.html, replyTo: enquiry.email },
    apiKey,
    env,
    fetchImpl,
  );
  if (!sent.ok) {
    console.error('[advertising] Enquiry was saved but the internal notification failed');
  }
}

async function readPortalId(token: string, fetchImpl: typeof fetch): Promise<string | null> {
  const result = await hubspot('/account-info/v3/details', { method: 'GET' }, token, fetchImpl);
  if (!result.ok || !isRecord(result.json)) return null;
  const portalId = result.json.portalId;
  if (typeof portalId === 'number' && Number.isFinite(portalId)) return String(portalId);
  if (typeof portalId === 'string' && /^\d+$/.test(portalId)) return portalId;
  return null;
}

async function sendAcknowledgement(
  to: string,
  email: { subject: string; text: string; html: string },
  apiKey: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean }> {
  return sendResendEmail(
    { to: [to], subject: email.subject, text: email.text, html: email.html },
    apiKey,
    env,
    fetchImpl,
  );
}

async function sendResendEmail(
  message: { to: string[]; subject: string; text: string; html: string; replyTo?: string },
  apiKey: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean }> {
  try {
    const response = await fetchImpl(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: shopEmailFromAddress(env),
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { id?: string } | null;
    if (!response.ok || !body?.id) {
      console.error('[advertising] Resend did not accept the email', response.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error('[advertising] Resend request failed', error instanceof Error ? error.message : 'unknown');
    return { ok: false };
  }
}

async function hubspot(
  path: string,
  init: { method: string; body?: unknown },
  token: string,
  fetchImpl: typeof fetch,
): Promise<HubspotResult> {
  const response = await fetchImpl(`${HUBSPOT_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, json };
}

function splitName(full: string): { firstname: string; lastname: string } {
  const parts = full.trim().split(/\s+/);
  return {
    firstname: parts[0] ?? '',
    lastname: parts.slice(1).join(' '),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
