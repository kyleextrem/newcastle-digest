const PENDING_EMAIL_KEY = 'nd_pending_email';
const SIGNUP_TRACKED_KEY = 'nd_signup_tracked';
const SUBSCRIBED_KEY = 'nd_subscribed';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function rememberPendingEmail(email: string | null | undefined) {
  if (!hasWindow() || !email) return;
  const value = email.trim().toLowerCase();
  if (!value.includes('@')) return;
  sessionStorage.setItem(PENDING_EMAIL_KEY, value);
}

export function readPendingEmail(legacyEmail?: string | null) {
  const legacy = legacyEmail?.trim().toLowerCase() || '';
  if (!hasWindow()) return legacy || null;
  const stored = sessionStorage.getItem(PENDING_EMAIL_KEY)?.trim().toLowerCase() || '';
  return stored || legacy || null;
}

export function hasTrackedSignup() {
  if (!hasWindow()) return false;
  return sessionStorage.getItem(SIGNUP_TRACKED_KEY) === '1';
}

export function markSignupTracked() {
  if (!hasWindow()) return;
  sessionStorage.setItem(SIGNUP_TRACKED_KEY, '1');
}

export function markSubscribed() {
  if (!hasWindow()) return;
  localStorage.setItem(SUBSCRIBED_KEY, '1');
}

export function isSubscribed() {
  if (!hasWindow()) return false;
  return localStorage.getItem(SUBSCRIBED_KEY) === '1';
}
