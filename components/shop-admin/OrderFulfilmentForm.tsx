'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { packOrderAction, shipOrderAction } from '@/app/shop/admin/actions';

const labelClass = 'font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]';
const inputClass =
  'mt-2 w-full rounded-2xl border border-[#251f18]/10 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] outline-none focus:border-[#849bff]';

export function OrderFulfilmentForm({
  orderId,
  canPack,
  canShip,
}: {
  orderId: string;
  canPack: boolean;
  canShip: boolean;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!canPack && !canShip) {
    return null;
  }

  const run = async (work: () => Promise<{ ok: true; id?: string } | { ok: false; error: string }>) => {
    setBusy(true);
    setError('');
    const result = await work();
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
      <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Fulfilment</h2>
      {error ? (
        <p className="font-sans-main text-sm text-[#251f18]" role="alert">
          {error}
        </p>
      ) : null}
      {canShip ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Carrier</span>
            <input className={inputClass} value={carrier} onChange={(event) => setCarrier(event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Tracking number</span>
            <input
              className={inputClass}
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
            />
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canPack ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => packOrderAction(orderId))}
            className="rounded-full border border-[#251f18] px-6 py-3 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-40"
          >
            Mark packed
          </button>
        ) : null}
        {canShip ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(() =>
                shipOrderAction({
                  id: orderId,
                  carrier,
                  trackingNumber,
                }),
              )
            }
            className="rounded-full bg-[#849bff] px-6 py-3 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6] disabled:opacity-40"
          >
            Mark shipped
          </button>
        ) : null}
      </div>
    </section>
  );
}
