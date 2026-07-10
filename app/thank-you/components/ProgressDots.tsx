'use client';

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 pt-8 pb-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-colors duration-300 ${
            i === currentStep ? 'bg-[#849bff]' : 'bg-[#251f18]/20'
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}
