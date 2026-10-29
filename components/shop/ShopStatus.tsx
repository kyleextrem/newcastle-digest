import Link from 'next/link';

export function ShopEmptyState() {
  return (
    <div className="rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:px-12 sm:py-24">
      <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
        Coming into the shop
      </p>
      <h2 className="mx-auto mt-4 max-w-xl font-sans-main text-4xl font-black uppercase tracking-tighter leading-none text-[#251f18] md:text-6xl">
        Nothing is listed yet
      </h2>
      <p className="mx-auto mt-6 max-w-md font-sans-main text-lg leading-relaxed text-[#251f18]/60">
        New pieces from Newcastle Digest will show up here. Nothing is held, posted, or charged
        from this page yet.
      </p>
      <p className="mx-auto mt-8 max-w-md font-sans-main text-base leading-relaxed text-[#251f18]/70">
        The shop you already know is still open at{' '}
        <a
          href="https://shop.newcastledigest.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#849bff] underline underline-offset-2 hover:opacity-70"
        >
          shop.newcastledigest.com
        </a>
        .
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
    <div className="rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:px-12 sm:py-20">
      <h2 className="font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:text-5xl">
        The shop can&apos;t be loaded
      </h2>
      <p className="mx-auto mt-4 max-w-md font-sans-main text-lg text-[#251f18]/60">
        Try again in a moment. Your cart on this device is unchanged.
      </p>
    </div>
  );
}
