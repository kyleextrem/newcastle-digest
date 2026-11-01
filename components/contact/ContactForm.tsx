'use client';

import { useState, type FormEvent, type ReactNode } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[#251f18]/15 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] placeholder:text-[#251f18]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]';

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
          companyWebsite: data.get('companyWebsite'),
        }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setStatus('error');
        setError(body?.error || "We couldn't send your message just now. Email kyle@newcastledigest.com and we'll pick it up.");
        return;
      }
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setError("We couldn't send your message. Check your connection and try again.");
    }
  }

  if (status === 'success') {
    return (
      <p role="status" className="font-sans-main text-lg leading-relaxed text-[#251f18]">
        Thanks for getting in touch. Your message has been sent, and we&apos;ll get back to you as soon as we can.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field id="contact-name" label="Name" required>
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100} className={INPUT_CLASS} />
      </Field>
      <Field id="contact-email" label="Email" required>
        <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} className={INPUT_CLASS} />
      </Field>
      <Field id="contact-subject" label="Subject">
        <input id="contact-subject" name="subject" type="text" maxLength={160} className={INPUT_CLASS} />
      </Field>
      <Field id="contact-message" label="Message" required>
        <textarea id="contact-message" name="message" required rows={6} maxLength={5000} className={INPUT_CLASS} />
      </Field>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-website">Company website</label>
        <input id="contact-website" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === 'error' ? (
        <p role="alert" className="font-sans-main text-sm leading-relaxed text-[#9f1239]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#251f18] px-6 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#849bff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status === 'submitting' ? 'Sending' : 'Send message'}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-sans-main text-sm font-bold text-[#251f18]">
        {label}
        {required ? <span className="ml-2 font-normal text-[#849bff]">Required</span> : <span className="ml-2 font-normal text-[#251f18]/45">Optional</span>}
      </label>
      {children}
    </div>
  );
}
