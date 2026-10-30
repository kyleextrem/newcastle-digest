'use client';

interface StepBusinessProps {
  onChoose: (choice: 'yes' | 'no' | 'skip') => void;
}

export function StepBusiness({ onChoose }: StepBusinessProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div>
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter text-[#251f18] sm:text-3xl">
            Do you run a business?
          </h2>
          <p className="mt-3 font-sans-main text-sm text-[#251f18]/60 sm:text-base">
            So we send you the right stuff.
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => onChoose('yes')}
            className="w-full rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#6a7be6]"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChoose('no')}
            className="w-full rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#6a7be6]"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onChoose('skip')}
            className="mt-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45 transition-colors hover:text-[#251f18]"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
