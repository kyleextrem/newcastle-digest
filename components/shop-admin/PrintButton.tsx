'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-[#849bff] px-5 py-2.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white"
    >
      Print
    </button>
  );
}
