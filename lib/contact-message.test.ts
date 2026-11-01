import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { POST } from '../app/api/contact/route';
import { contactNotificationEmail, submitContactMessage, validateContactMessage } from './contact-message';

const validMessage = {
  name: 'Alex Reader',
  email: 'alex@example.com',
  subject: 'A local story',
  message: 'I wanted to pass on something happening in Hamilton.',
};

describe('contact message validation', () => {
  it('accepts a complete message', () => {
    const result = validateContactMessage(validMessage);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.message.email, 'alex@example.com');
  });

  it('accepts a message without a subject', () => {
    const result = validateContactMessage({ ...validMessage, subject: '  ' });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.message.subject, '');
  });

  it('rejects a missing message before any email is sent', () => {
    const result = validateContactMessage({ ...validMessage, message: '' });
    assert.equal(result.ok, false);
  });

  it('rejects an invalid email', () => {
    const result = validateContactMessage({ ...validMessage, email: 'not-an-email' });
    assert.equal(result.ok, false);
  });
});

describe('contact notification', () => {
  it('includes the sender, subject and full message', () => {
    const email = contactNotificationEmail(validMessage);
    assert.equal(email.subject, 'New message: A local story');
    assert.match(email.text, /Name: Alex Reader/);
    assert.match(email.text, /Email: alex@example.com/);
    assert.match(email.text, /Subject: A local story/);
    assert.match(email.text, /I wanted to pass on something happening in Hamilton\./);
  });
});

describe('submitContactMessage', () => {
  it('emails the configured inbox and replies to the sender', async () => {
    const calls: string[] = [];
    const result = await submitContactMessage(validMessage, {
      RESEND_API_KEY: 're_test',
      SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
    }, async (input, init) => {
      const url = String(input);
      calls.push(url);
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.to, ['kyle@newcastledigest.com']);
      assert.equal(body.reply_to, 'alex@example.com');
      assert.equal(body.subject, 'New message: A local story');
      assert.match(body.text, /Hamilton/);
      return json({ id: 'email-1' });
    });

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(calls, ['https://api.resend.com/emails']);
  });

  it('does not send when the inbox is not configured', async () => {
    let called = false;
    const result = await submitContactMessage(validMessage, { RESEND_API_KEY: 're_test' }, async () => {
      called = true;
      return json({});
    });
    assert.equal(result.ok, false);
    assert.equal(called, false);
  });

  it('does not claim success when the email is rejected', async () => {
    const result = await submitContactMessage(validMessage, {
      RESEND_API_KEY: 're_test',
      SHOP_ADMIN_EMAILS: 'kyle@newcastledigest.com',
    }, async () => json({ message: 'rejected' }, 422));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /couldn't send your message/);
  });
});

describe('contact route', () => {
  it('accepts a honeypot without sending mail', async () => {
    const response = await post({ ...validMessage, companyWebsite: 'https://spam.example' }, '203.0.113.20');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  });

  it('rejects a message with no body text', async () => {
    const response = await post({ ...validMessage, message: '' }, '203.0.113.21');
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  });

  it('limits repeated messages from the same network', async () => {
    const ip = '203.0.113.22';
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await post({ ...validMessage, message: '' }, ip);
      assert.equal(response.status, 400);
    }
    const blocked = await post(validMessage, ip);
    assert.equal(blocked.status, 429);
  });
});

function post(body: unknown, ip: string): Promise<Response> {
  return POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    }),
  );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
