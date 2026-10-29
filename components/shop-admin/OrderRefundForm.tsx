'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refundOrderAction } from '@/app/shop/admin/actions';
import { formatAudCents } from '@/lib/shop-display';

const labelClass = 'font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]';
const inputClass =
  'mt-2 w-full rounded-2xl border border-[#251f18]/10 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] outline-none focus:border-[#849bff]';

export function OrderRefundForm({
  orderId,
  remainingCents,
}: {
  orderId: string;
  remainingCents: number;
}) {
  const router = useRouter();
  const remaining = (remainingCents / 100).toFixed(2);
  const [amount, setAmount] = useState(remaining);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (value: string) => {
    setBusy(true);
    setError('');
    const result = await refundOrderAction({ id: orderId, amount: value });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
      <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Refund</h2>
      <p className="font-sans-main text-sm leading-relaxed text-[#251f18]/70">
        Refunds go through Stripe and do not put stock back. Remaining:{' '}
        {formatAudCents(remainingCents)}.
      </p>
      {error ? (
        <p className="font-sans-main text-sm text-[#251f18]" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block max-w-xs">
        <span className={labelClass}>Amount (AUD)</span>
        <input
          className={inputClass}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(amount)}
          className="rounded-full border border-[#251f18] px-6 py-3 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-40"
        >
          Refund amount
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(remaining)}
          className="rounded-full bg-[#849bff] px-6 py-3 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6] disabled:opacity-40"
        >
          Refund remaining
        </button>
      </div>
    </section>
  );
}
