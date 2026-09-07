'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#849bff', '#faf9f6', '#251f18'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#849bff', '#faf9f6', '#251f18'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead');
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <h1 className="max-w-2xl font-sans-main text-4xl font-black leading-[0.95] tracking-tighter text-[#251f18] sm:text-5xl md:text-6xl">
        Thanks for subscribing.
      </h1>
      <p className="mt-6 max-w-lg font-sans-main text-base leading-relaxed text-[#251f18]/65 sm:text-lg">
        You&apos;ve just joined 7,300+ Newcastle locals. Every Wednesday we drop the best of
        what&apos;s on, where to eat, and what&apos;s happening around town. Now, a couple of quick
        things while you&apos;re here.
      </p>
      <button
        type="button"
        onClick={onNext}
        className="mt-12 rounded-full bg-[#849bff] px-8 py-4 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#6a7be6]"
      >
        While you&apos;re here →
      </button>
    </div>
  );
}
