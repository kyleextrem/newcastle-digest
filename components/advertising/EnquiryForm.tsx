'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PROMOTION_GOALS, goalLabel, packageLabel, type AdvertisingPackage } from '@/lib/advertising';

type EnquirySource = 'work' | 'contact';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const INPUT_CLASS =
  'w-full rounded-2xl border border-[#251f18]/15 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] placeholder:text-[#251f18]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]';

export function AdvertisingEnquiryForm({
  source,
  initialPackage = 'unsure',
  idPrefix,
  onSuccess,
}: {
  source: EnquirySource;
  initialPackage?: AdvertisingPackage;
  idPrefix: string;
  onSuccess?: () => void;
}) {
  const [packageId, setPackageId] = useState<AdvertisingPackage>(initialPackage);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setPackageId(initialPackage);
  }, [initialPackage]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/advertising/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          businessName: data.get('businessName'),
          goal: data.get('goal'),
          packageId: data.get('packageId'),
          details: data.get('details'),
          source,
          companyWebsite: data.get('companyWebsite'),
        }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setStatus('error');
        setError(body?.error || "We couldn't send your enquiry. Try again, or email kyle@newcastledigest.com.");
        return;
      }
      setStatus('success');
      form.reset();
      onSuccess?.();
    } catch {
      setStatus('error');
      setError("We couldn't send your enquiry. Check your connection and try again.");
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-[28px] bg-[#faf9f6] px-6 py-8 text-[#251f18]">
        <h3 className="font-sans-main text-2xl font-black tracking-tight">Enquiry received.</h3>
        <p className="mt-3 font-sans-main text-base leading-relaxed text-[#251f18]/75">
          We&apos;ve received your enquiry and will reply by email within one business day.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field id={`${idPrefix}-name`} label="Your name" required>
        <input id={`${idPrefix}-name`} name="name" type="text" autoComplete="name" required maxLength={100} className={INPUT_CLASS} />
      </Field>
      <Field id={`${idPrefix}-email`} label="Email address" required>
        <input id={`${idPrefix}-email`} name="email" type="email" autoComplete="email" required maxLength={254} className={INPUT_CLASS} />
      </Field>
      <Field id={`${idPrefix}-business`} label="Business name" required>
        <input id={`${idPrefix}-business`} name="businessName" type="text" autoComplete="organization" required maxLength={120} className={INPUT_CLASS} />
      </Field>
      <fieldset className="space-y-3">
        <legend className="font-sans-main text-sm font-bold text-[#251f18]">
          What would you like to promote? <span className="text-[#849bff]">Required</span>
        </legend>
        <div className="grid gap-2">
          {PROMOTION_GOALS.map((goal) => (
            <label key={goal} className="flex items-center gap-3 rounded-2xl border border-[#251f18]/10 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#849bff]">
              <input type="radio" name="goal" value={goal} required className="h-4 w-4 accent-[#251f18]" />
              {goalLabel(goal)}
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="packageId" value={packageId} />
      <Field id={`${idPrefix}-details`} label="Additional details">
        <textarea
          id={`${idPrefix}-details`}
          name="details"
          rows={4}
          maxLength={2000}
          placeholder="Optional. A sentence or two is enough."
          className={INPUT_CLASS}
        />
      </Field>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Company website</label>
        <input id={`${idPrefix}-website`} name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
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
        {status === 'submitting' ? 'Sending' : 'Send enquiry'}
      </button>
      <p className="font-sans-main text-sm leading-relaxed text-[#251f18]/60">
        No call and no payment to enquire. We reply by email.
      </p>
    </form>
  );
}

export function AdvertisingEnquiryModal({
  open,
  source,
  packageId,
  onClose,
}: {
  open: boolean;
  source: EnquirySource;
  packageId: AdvertisingPackage;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const name = dialogRef.current?.querySelector('input[name="name"]');
    if (name instanceof HTMLElement) name.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" aria-label="Close enquiry form" className="absolute inset-0 bg-[#251f18]/70" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-[#faf9f6] p-6 text-[#251f18] shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">Advertising enquiry</p>
            <h2 id={titleId} className="mt-2 font-sans-main text-3xl font-black tracking-tight">
              {packageId === 'unsure' ? 'Enquire about advertising' : packageLabel(packageId)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/70 hover:text-[#251f18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]"
          >
            Close
          </button>
        </div>
        <AdvertisingEnquiryForm source={source} initialPackage={packageId} idPrefix={`modal-${source}`} />
      </div>
    </div>
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
