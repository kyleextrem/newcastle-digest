import { ALLOWED_INTEREST_IDS } from '@/lib/beehiiv-subscriber';

export type BusinessAnswer = 'yes' | 'no' | 'skip' | null;
export type SaveKey = 'business' | 'postcode' | 'ranking';
export type EndScreenAudience = 'business' | 'reader';

export type ThankYouProgress = {
  step: number;
  business: BusinessAnswer;
  postcode: string;
  interestIds: string[];
  failed: SaveKey[];
  missingEmail: boolean;
};

export type ProfileRequest =
  | { action: 'skip' }
  | { action: 'missing-email' }
  | { action: 'save'; body: Record<string, unknown> };

export type SaveOutcome = { ok: true } | { ok: false };

const PROGRESS_KEY = 'nd_thank_you_progress';
const LAST_STEP = 4;

export const DEFAULT_INTEREST_IDS = [...ALLOWED_INTEREST_IDS];

export function defaultThankYouProgress(): ThankYouProgress {
  return {
    step: 0,
    business: null,
    postcode: '',
    interestIds: [...DEFAULT_INTEREST_IDS],
    failed: [],
    missingEmail: false,
  };
}

export function endScreenAudience(business: BusinessAnswer): EndScreenAudience {
  switch (business) {
    case 'yes':
      return 'business';
    case 'no':
    case 'skip':
    case null:
      return 'reader';
    default: {
      const unreachable: never = business;
      return unreachable;
    }
  }
}

export function requestForSave(
  key: SaveKey,
  progress: ThankYouProgress,
  email: string | null,
): ProfileRequest {
  switch (key) {
    case 'business':
      if (progress.business !== 'yes' && progress.business !== 'no') return { action: 'skip' };
      if (!email) return { action: 'missing-email' };
      return { action: 'save', body: { email, runs_business: progress.business } };
    case 'postcode': {
      const postcode = progress.postcode.trim();
      if (!postcode) return { action: 'skip' };
      if (!email) return { action: 'missing-email' };
      return { action: 'save', body: { email, postcode } };
    }
    case 'ranking':
      if (!email) return { action: 'missing-email' };
      return {
        action: 'save',
        body: {
          email,
          interests: progress.interestIds,
          tags: progress.interestIds.slice(0, 3),
        },
      };
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}

export function createSubmitGate() {
  const pending = new Set<string>();
  return {
    tryBegin(key: string) {
      if (pending.has(key)) return false;
      pending.add(key);
      return true;
    },
    end(key: string) {
      pending.delete(key);
    },
  };
}

export async function runProfileSave(
  key: string,
  request: ProfileRequest,
  gate: ReturnType<typeof createSubmitGate>,
  save: (body: Record<string, unknown>) => Promise<SaveOutcome>,
): Promise<'duplicate' | 'skipped' | 'missing-email' | 'saved' | 'failed'> {
  switch (request.action) {
    case 'skip':
      return 'skipped';
    case 'missing-email':
      return 'missing-email';
    case 'save':
      break;
    default: {
      const unreachable: never = request;
      return unreachable;
    }
  }

  if (!gate.tryBegin(key)) return 'duplicate';
  try {
    const result = await save(request.body);
    return result.ok ? 'saved' : 'failed';
  } finally {
    gate.end(key);
  }
}

type SubscriberResponse = {
  ok?: boolean;
  fields?: Record<string, { ok?: boolean } | undefined>;
};

export async function saveSubscriberProfile(
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<SaveOutcome> {
  try {
    const response = await fetchImpl('/api/beehiiv/subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await readPayload(response);
    if (!response.ok || payload?.ok !== true) return { ok: false };
    const fields = payload.fields ?? {};
    if (Object.values(fields).some((field) => field?.ok === false)) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

async function readPayload(response: Response): Promise<SubscriberResponse | null> {
  try {
    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== 'object') return null;
    return payload as SubscriberResponse;
  } catch {
    return null;
  }
}

export function serializeThankYouProgress(progress: ThankYouProgress): string {
  return JSON.stringify({
    step: progress.step,
    business: progress.business,
    postcode: progress.postcode,
    interestIds: progress.interestIds,
    failed: progress.failed,
    missingEmail: progress.missingEmail,
  });
}

export function parseThankYouProgress(raw: string | null): ThankYouProgress | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.step !== 'number' || !Number.isInteger(record.step)) return null;
  if (record.step < 0 || record.step > LAST_STEP) return null;
  if (!isBusinessAnswer(record.business)) return null;
  if (typeof record.postcode !== 'string') return null;
  if (typeof record.missingEmail !== 'boolean') return null;
  if (!Array.isArray(record.failed) || !record.failed.every(isSaveKey)) return null;

  return {
    step: record.step,
    business: record.business,
    postcode: record.postcode,
    interestIds: isInterestOrder(record.interestIds) ? record.interestIds : [...DEFAULT_INTEREST_IDS],
    failed: record.failed,
    missingEmail: record.missingEmail,
  };
}

export function readThankYouProgress(): ThankYouProgress | null {
  if (typeof window === 'undefined') return null;
  return parseThankYouProgress(window.sessionStorage.getItem(PROGRESS_KEY));
}

export function writeThankYouProgress(progress: ThankYouProgress) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PROGRESS_KEY, serializeThankYouProgress(progress));
}

function isBusinessAnswer(value: unknown): value is BusinessAnswer {
  return value === null || value === 'yes' || value === 'no' || value === 'skip';
}

function isSaveKey(value: unknown): value is SaveKey {
  return value === 'business' || value === 'postcode' || value === 'ranking';
}

function isInterestOrder(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length !== DEFAULT_INTEREST_IDS.length) return false;
  const allowed = new Set<string>(DEFAULT_INTEREST_IDS);
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.has(entry) || seen.has(entry)) return false;
    seen.add(entry);
  }
  return seen.size === DEFAULT_INTEREST_IDS.length;
}

export function orderedInterestIds(ids: readonly string[]): string[] {
  return isInterestOrder(ids) ? [...ids] : [...DEFAULT_INTEREST_IDS];
}
