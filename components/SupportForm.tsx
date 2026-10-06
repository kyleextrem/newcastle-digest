'use client';

import React, { useState } from 'react';
import { parseContributionAmount } from '@/lib/support-contribution';

type SupportFormProps = {
  initialAmount: string;
};

function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned.slice(0, 9);
  const whole = cleaned.slice(0, dot).slice(0, 9);
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${fraction}`;
}

function messageFromResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('error' in data)) return null;
  const error = data.error;
  if (typeof error !== 'string' || error.length === 0 || error.length > 160) return null;
  if (/sk_|rk_|whsec_/.test(error)) return null;
  return error;
}

export const SupportForm: React.FC<SupportFormProps> = ({ initialAmount }) => {
  const [amount, setAmount] = useState(initialAmount);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseContributionAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/support/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed.amount }),
      });
      const data: unknown = await response.json().catch(() => null);
      const url =
        data && typeof data === 'object' && 'url' in data && typeof data.url === 'string'
          ? data.url
          : null;

      if (!response.ok || !url || !url.startsWith('https://checkout.stripe.com/')) {
        setError(messageFromResponse(data) ?? 'We could not start checkout. Please try again.');
        setSubmitting(false);
        return;
      }

      window.location.assign(url);
    } catch {
      setError('We could not start checkout. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md">
      <label htmlFor="support-amount" className="sr-only">
        Contribution amount in Australian dollars
      </label>
      <div className="flex w-full items-center gap-3 border-b border-[#251f18]/20 pb-3 focus-within:border-[#849bff]">
        <span className="font-sans-main text-3xl text-[#251f18]/45 md:text-4xl" aria-hidden="true">
          $
        </span>
        <input
          id="support-amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={amount}
          aria-invalid={error && !parseContributionAmount(amount).ok ? true : undefined}
          aria-describedby={error ? 'support-amount-hint support-amount-error' : 'support-amount-hint'}
          onChange={(event) => {
            setAmount(sanitizeAmountInput(event.target.value));
            if (error) setError('');
          }}
          onBlur={() => {
            const parsed = parseContributionAmount(amount);
            if (parsed.ok) setAmount(parsed.amount);
          }}
          className="min-w-0 flex-1 bg-transparent font-sans-main text-3xl font-black tabular-nums tracking-tight text-[#251f18] outline-none sm:text-4xl md:text-5xl"
        />
        <span className="font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#251f18]/45">
          AUD
        </span>
      </div>
      <p id="support-amount-hint" className="mt-4 font-sans-main text-base text-[#251f18]/60">
        Choose any amount.
      </p>
      {error ? (
        <p id="support-amount-error" role="alert" className="mt-3 font-sans-main text-sm text-[#251f18]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-all hover:bg-[#251f18] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Taking you to checkout' : 'Support Newcastle Digest'}
      </button>
    </form>
  );
};
