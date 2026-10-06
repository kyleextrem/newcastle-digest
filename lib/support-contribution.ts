/** Minimum contribution: $1.00 AUD. */
export const MIN_CONTRIBUTION_CENTS = 100;

/**
 * Stripe `unit_amount` maximum is 99,999,999 cents ($999,999.99).
 * This is Stripe's bound, not a suggested contribution size.
 */
export const MAX_CONTRIBUTION_CENTS = 99_999_999;

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export type ContributionAmount =
  | { ok: true; cents: number; amount: string }
  | { ok: false; error: string };

const INVALID_AMOUNT = 'Enter a valid amount in Australian dollars.';
const BELOW_MINIMUM = 'The minimum contribution is $1.';
const ABOVE_MAXIMUM = 'Enter an amount of $999,999.99 or less.';

export function formatAudAmount(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `${dollars}.${String(remainder).padStart(2, '0')}`;
}

/**
 * Parse a dollar string into integer cents.
 * Rejects anything that is not a normal decimal amount, including
 * zero, negatives, NaN, Infinity, and values with more than two decimal places.
 */
export function parseContributionAmount(input: unknown): ContributionAmount {
  if (typeof input !== 'string') {
    return { ok: false, error: INVALID_AMOUNT };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 12 || !AMOUNT_PATTERN.test(trimmed)) {
    return { ok: false, error: INVALID_AMOUNT };
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.');
  const cents = Number(wholePart) * 100 + Number((fractionPart + '00').slice(0, 2));

  if (!Number.isSafeInteger(cents)) {
    return { ok: false, error: INVALID_AMOUNT };
  }

  if (cents < MIN_CONTRIBUTION_CENTS) {
    return { ok: false, error: BELOW_MINIMUM };
  }

  if (cents > MAX_CONTRIBUTION_CENTS) {
    return { ok: false, error: ABOVE_MAXIMUM };
  }

  return { ok: true, cents, amount: formatAudAmount(cents) };
}
