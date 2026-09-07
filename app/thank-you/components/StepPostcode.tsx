'use client';

import { useState } from 'react';

interface StepPostcodeProps {
  onNext: (postcode: string) => void;
}

export function StepPostcode({ onNext }: StepPostcodeProps) {
  const [postcode, setPostcode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(postcode.trim());
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="w-full text-center">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter text-[#251f18] sm:text-3xl">
            Where are you based?
          </h2>
          <p className="mt-3 font-sans-main text-sm text-[#251f18]/60 sm:text-base">
            Helps us keep things local and relevant.
          </p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="2300"
          autoFocus
          className="w-full border-b-2 border-[#251f18]/15 bg-transparent py-4 text-center font-sans-main text-5xl font-black tracking-tight text-[#251f18] placeholder:text-[#251f18]/20 focus:border-[#849bff] focus:outline-none sm:text-6xl"
        />
        <button
          type="submit"
          className="rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#6a7be6]"
        >
          Next →
        </button>
      </form>
    </div>
  );
}
