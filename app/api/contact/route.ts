/**
 * POST /api/contact
 * Emails a general message to SHOP_ADMIN_EMAILS. Does not create a HubSpot
 * deal, subscribe the sender, or send an advertising acknowledgement.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { submitContactMessage, validateContactMessage } from '@/lib/contact-message';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'That message is too long.' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Check the form and try again.' }, 400);
  }

  const limited = rateLimit({
    key: `contact:${clientIp(request)}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return json(
      { ok: false, error: 'Too many messages from this network. Try again later, or email kyle@newcastledigest.com.' },
      429,
      { 'Retry-After': String(limited.retryAfterSec) },
    );
  }

  const record = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
  if (typeof record.companyWebsite === 'string' && record.companyWebsite.trim()) {
    return json({ ok: true }, 200);
  }

  const parsed = validateContactMessage(body);
  if (!parsed.ok) {
    return json({ ok: false, error: parsed.error }, 400);
  }

  const result = await submitContactMessage(parsed.message);
  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.status);
  }

  return json({ ok: true }, 200);
}

function json(body: { ok: boolean; error?: string }, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}
