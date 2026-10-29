import Link from 'next/link';

export function ShopEmptyState() {
  return (
    <div className="rounded-[28px] bg-[#f5f4f0] px-6 py-14 md:rounded-[40px] md:px-12 md:py-16">
      <h2 className="max-w-xl font-sans-main text-3xl font-black uppercase leading-none tracking-tighter text-[#251f18] md:text-5xl">
        Nothing is listed yet
      </h2>
      <p className="mt-6 max-w-md font-sans-main text-lg leading-relaxed text-[#251f18]/60">
        New pieces from Newcastle Digest will show up here. Nothing is held, posted, or charged
        from this page yet.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex rounded-full bg-[#849bff] px-8 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#6a7be6]"
      >
        Back home
      </Link>
    </div>
  );
}

export function ShopUnavailable() {
  return (
    <div className="rounded-[28px] bg-[#f5f4f0] px-6 py-14 md:rounded-[40px] md:px-12 md:py-16">
      <h2 className="font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:text-5xl">
        The shop can&apos;t be loaded
      </h2>
      <p className="mt-4 max-w-md font-sans-main text-lg text-[#251f18]/60">
        Try again in a moment. Your cart on this device is unchanged.
      </p>
    </div>
  );
}
