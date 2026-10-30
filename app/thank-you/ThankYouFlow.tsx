'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { sanitizePageLocation, trackSignUp } from '@/lib/analytics';
import {
  hasTrackedSignup,
  markSignupTracked,
  markSubscribed,
  readPendingEmail,
  rememberPendingEmail,
} from '@/lib/subscriber-session';
import {
  createSubmitGate,
  defaultThankYouProgress,
  endScreenAudience,
  orderedInterestIds,
  readThankYouProgress,
  requestForSave,
  runProfileSave,
  saveSubscriberProfile,
  writeThankYouProgress,
  type SaveKey,
  type ThankYouProgress,
} from '@/lib/thank-you-profile';
import { DEFAULT_INTERESTS, type InterestItem } from './constants';
import { ProgressDots } from './components/ProgressDots';
import { StepWelcome } from './components/StepWelcome';
import { StepBusiness } from './components/StepBusiness';
import { StepPostcode } from './components/StepPostcode';
import { StepRank } from './components/StepRank';
import { StepEndScreen } from './components/StepEndScreen';

const TOTAL_STEPS = 5;

function interestsFromIds(ids: readonly string[]): InterestItem[] {
  const ordered = orderedInterestIds(ids);
  const byId = new Map(DEFAULT_INTERESTS.map((item) => [item.id, item]));
  return ordered.map((id) => byId.get(id)).filter((item): item is InterestItem => item !== undefined);
}

function stripEmailFromAddressBar() {
  const current = window.location.href;
  const sanitized = sanitizePageLocation(current);
  if (sanitized === current) return;
  const url = new URL(sanitized);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function ThankYouFlow() {
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<ThankYouProgress>(defaultThankYouProgress);
  const progressRef = useRef(progress);
  const emailRef = useRef<string | null>(null);
  const gateRef = useRef(createSubmitGate());
  const reportedSignup = useRef(false);
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    const legacyEmail = searchParams.get('email');
    const src = searchParams.get('src');
    rememberPendingEmail(legacyEmail);
    const resolved = readPendingEmail(legacyEmail);
    emailRef.current = resolved;
    stripEmailFromAddressBar();

    if (!hydrated.current) {
      const stored = readThankYouProgress();
      if (stored) {
        progressRef.current = stored;
        setProgress(stored);
      }
      hydrated.current = true;
    }

    if (!reportedSignup.current && !hasTrackedSignup()) {
      reportedSignup.current = true;
      trackSignUp({ method: 'beehiiv_redirect', location: src || 'unknown' });
      markSignupTracked();
    }

    if (resolved || src) {
      markSubscribed();
    }
  }, [searchParams]);

  function patchProgress(patch: Partial<ThankYouProgress>) {
    const next = { ...progressRef.current, ...patch };
    progressRef.current = next;
    writeThankYouProgress(next);
    setProgress(next);
    if (patch.step !== undefined) window.scrollTo(0, 0);
  }

  async function settle(key: SaveKey, snapshot: ThankYouProgress) {
    const outcome = await runProfileSave(
      key,
      requestForSave(key, snapshot, emailRef.current),
      gateRef.current,
      saveSubscriberProfile,
    );
    if (outcome === 'missing-email') patchProgress({ missingEmail: true });
    if (outcome === 'failed' && !progressRef.current.failed.includes(key)) {
      patchProgress({ failed: [...progressRef.current.failed, key] });
    }
    if (outcome === 'saved') {
      patchProgress({ failed: progressRef.current.failed.filter((item) => item !== key) });
    }
  }

  function chooseBusiness(choice: 'yes' | 'no' | 'skip') {
    if (progressRef.current.step !== 1) return;
    patchProgress({ step: 2, business: choice });
    if (choice === 'yes' || choice === 'no') {
      void settle('business', progressRef.current);
    }
  }

  function finishPostcode(value: string) {
    if (progressRef.current.step !== 2) return;
    patchProgress({ step: 3, postcode: value.trim() });
    void settle('postcode', progressRef.current);
  }

  function finishRank(items: InterestItem[]) {
    if (progressRef.current.step !== 3) return;
    patchProgress({ step: 4, interestIds: items.map((item) => item.id) });
    void settle('ranking', progressRef.current);
  }

  async function retryFailed() {
    const keys = [...progressRef.current.failed];
    for (const key of keys) {
      await settle(key, progressRef.current);
    }
  }

  const rankedItems = interestsFromIds(progress.interestIds);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <ProgressDots currentStep={progress.step} totalSteps={TOTAL_STEPS} />
      {progress.missingEmail || progress.failed.length > 0 ? (
        <div className="px-6 pb-2 text-center">
          {progress.missingEmail ? (
            <p className="font-sans-main text-sm text-[#251f18]/65">
              We don&apos;t have your email, so this wasn&apos;t saved.
            </p>
          ) : null}
          {progress.failed.length > 0 ? (
            <p className="mt-1 font-sans-main text-sm text-[#251f18]/65">
              We couldn&apos;t save that.{' '}
              <button
                type="button"
                onClick={() => void retryFailed()}
                className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:text-[#6a7be6]"
              >
                Try again
              </button>
            </p>
          ) : null}
        </div>
      ) : null}

      {progress.step === 0 && <StepWelcome onNext={() => {
        if (progressRef.current.step !== 0) return;
        patchProgress({ step: 1 });
      }} />}
      {progress.step === 1 && <StepBusiness onChoose={chooseBusiness} />}
      {progress.step === 2 && (
        <StepPostcode
          initialPostcode={progress.postcode}
          onChange={(postcode) => patchProgress({ postcode })}
          onNext={finishPostcode}
        />
      )}
      {progress.step === 3 && (
        <StepRank
          initialItems={rankedItems}
          onChange={(items) => patchProgress({ interestIds: items.map((item) => item.id) })}
          onNext={finishRank}
        />
      )}
      {progress.step === 4 && <StepEndScreen audience={endScreenAudience(progress.business)} />}
    </div>
  );
}
