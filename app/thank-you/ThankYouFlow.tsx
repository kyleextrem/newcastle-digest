'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProgressDots } from './components/ProgressDots';
import { StepWelcome } from './components/StepWelcome';
import { StepPostcode } from './components/StepPostcode';
import { StepRank } from './components/StepRank';
import { StepEndScreen } from './components/StepEndScreen';
import type { InterestItem } from './constants';

const TOTAL_STEPS = 4;

function updateSubscriberProfile(email: string, postcode: string, topTags: string[]) {
  fetch('/api/beehiiv/subscriber', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      postcode: postcode || undefined,
      tags: topTags,
    }),
  }).catch(() => {
    // Fail silently, no loading state shown to user
  });
}

export function ThankYouFlow() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim().toLowerCase() ?? null;

  const [step, setStep] = useState(0);
  const [postcode, setPostcode] = useState('');

  const goToStep = useCallback((next: number) => {
    setStep(next);
    window.scrollTo(0, 0);
  }, []);

  const handlePostcodeNext = (value: string) => {
    setPostcode(value);
    goToStep(2);
  };

  const handleRankNext = (orderedInterests: InterestItem[]) => {
    if (email) {
      const topTags = orderedInterests.slice(0, 3).map((item) => item.tag);
      updateSubscriberProfile(email, postcode, topTags);
    }
    goToStep(3);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <ProgressDots currentStep={step} totalSteps={TOTAL_STEPS} />

      {step === 0 && <StepWelcome onNext={() => goToStep(1)} />}
      {step === 1 && <StepPostcode onNext={handlePostcodeNext} />}
      {step === 2 && <StepRank onNext={handleRankNext} />}
      {step === 3 && <StepEndScreen />}
    </div>
  );
}
