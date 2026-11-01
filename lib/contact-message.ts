import { parseAdminEmails } from '@/lib/shop-admin-policy';
import { shopEmailFromAddress } from '@/lib/shop-email-content';

const RESEND_API = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  name: 100,
  email: 254,
  subject: 160,
  message: 5000,
} as const;

export const CONTACT_NOT_SENT =
  "We couldn't send your message just now. Email kyle@newcastledigest.com and we'll pick it up.";

export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactMessageResult = { ok: true } | { ok: false; error: string; status: number };

export function validateContactMessage(
  value: unknown,
): { ok: true; message: ContactMessage } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Check the form and try again.' };
  }

  const body = value as Record<string, unknown>;
  const name = readString(body.name);
  const email = readString(body.email).toLowerCase();
  const subject = readString(body.subject);
  const message = readString(body.message);

  if (!name || !email || !message) {
    return { ok: false, error: 'Name, email and a message are required.' };
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    subject.length > LIMITS.subject ||
    message.length > LIMITS.message
  ) {
    return { ok: false, error: 'One of the fields is too long.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  return { ok: true, message: { name, email, subject, message } };
}

export function contactNotificationEmail(message: ContactMessage): { subject: string; text: string; html: string } {
  const subjectLine = message.subject || 'None';
  const lines = [
    'New Newcastle Digest contact message',
    '',
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    `Subject: ${subjectLine}`,
    '',
    message.message,
  ];
  const text = lines.join('\n');
  const html = lines.map((line) => (line ? `<p>${escapeHtml(line)}</p>` : '<br>')).join('');
  const subject = message.subject
    ? `New message: ${message.subject.replace(/[\r\n]+/g, ' ')}`
    : `New message from ${message.name.replace(/[\r\n]+/g, ' ')}`;
  return { subject, text, html };
}

export async function submitContactMessage(
  message: ContactMessage,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ContactMessageResult> {
  const apiKey = env.RESEND_API_KEY?.trim() ?? '';
  const recipients = parseAdminEmails(env.SHOP_ADMIN_EMAILS);
  if (!apiKey || recipients.length === 0) {
    console.error('[contact] Resend or SHOP_ADMIN_EMAILS is not configured');
    return { ok: false, error: CONTACT_NOT_SENT, status: 503 };
  }

  const email = contactNotificationEmail(message);
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
        to: recipients,
        reply_to: message.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { id?: string } | null;
    if (!response.ok || !body?.id) {
      console.error('[contact] Resend did not accept the message', response.status);
      return { ok: false, error: CONTACT_NOT_SENT, status: 502 };
    }
    return { ok: true };
  } catch (error) {
    console.error('[contact] Resend request failed', error instanceof Error ? error.message : 'unknown');
    return { ok: false, error: CONTACT_NOT_SENT, status: 502 };
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
