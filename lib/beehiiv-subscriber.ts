export const ALLOWED_INTEREST_IDS = [
  'food-drink',
  'events-nightlife',
  'live-music-gigs',
  'markets-shopping',
  'arts-culture',
  'fitness-outdoors',
] as const;

export type InterestId = (typeof ALLOWED_INTEREST_IDS)[number];
export type BusinessStatus = 'yes' | 'no';
export type SubscriberField = 'postcode' | 'runs_business' | 'interests' | 'tags';
export type CustomFieldName = 'postcode' | 'runs_business' | 'interests';

export type FieldResult = {
  ok: boolean;
  error?: string;
};

export type SubscriberUpdateBody =
  | { error: string }
  | {
      ok: boolean;
      fields: Partial<Record<SubscriberField, FieldResult>>;
    };

export type SubscriberUpdateResult = {
  status: number;
  body: SubscriberUpdateBody;
};

export type BeehiivMethod = 'GET' | 'PUT' | 'POST';

export type BeehiivCall = {
  path: string;
  method: BeehiivMethod;
  body?: unknown;
};

export type BeehiivResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export type BeehiivClient = (call: BeehiivCall) => Promise<BeehiivResult>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLICATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SUBSCRIPTION_ID_PATTERN = /^sub_[A-Za-z0-9-]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_POSTCODE_LENGTH = 32;
const MAX_TAGS = 3;

const ALLOWED_INTEREST_SET = new Set<string>(ALLOWED_INTEREST_IDS);

type ParsedSubscriberUpdate = {
  email: string;
  postcode?: string;
  runsBusiness?: BusinessStatus;
  interests?: InterestId[];
  tags?: InterestId[];
};

export function readBeehiivResponse(status: number, text: string): BeehiivResult {
  const ok = status >= 200 && status < 300;
  const trimmed = text.trim();
  if (!trimmed) return { ok, status, body: null };
  try {
    return { ok, status, body: JSON.parse(trimmed) as unknown };
  } catch {
    return { ok, status, body: null };
  }
}

export async function handleSubscriberUpdate(
  body: unknown,
  options: {
    publicationId: string | undefined;
    client: BeehiivClient;
  },
): Promise<SubscriberUpdateResult> {
  const parsed = parseSubscriberUpdate(body);
  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }

  const requested = parsed.value;
  if (
    requested.postcode === undefined &&
    requested.runsBusiness === undefined &&
    requested.interests === undefined &&
    requested.tags === undefined
  ) {
    return { status: 200, body: { ok: true, fields: {} } };
  }

  const publicationId = options.publicationId?.trim() ?? '';
  if (!PUBLICATION_ID_PATTERN.test(publicationId)) {
    return { status: 500, body: { error: 'Server configuration error' } };
  }

  const emailPath = encodeURIComponent(parsed.value.email);
  const byEmailPath = `/publications/${publicationId}/subscriptions/by_email/${emailPath}`;

  const [postcode, runsBusiness, interests, tags] = await Promise.all([
    requested.postcode === undefined
      ? undefined
      : putCustomField(options.client, byEmailPath, 'postcode', requested.postcode),
    requested.runsBusiness === undefined
      ? undefined
      : putCustomField(options.client, byEmailPath, 'runs_business', requested.runsBusiness),
    requested.interests === undefined
      ? undefined
      : putCustomField(options.client, byEmailPath, 'interests', requested.interests.join(',')),
    requested.tags === undefined
      ? undefined
      : addTags(options.client, publicationId, byEmailPath, requested.tags),
  ]);

  const fields: Partial<Record<SubscriberField, FieldResult>> = {};
  if (postcode !== undefined) fields.postcode = postcode;
  if (runsBusiness !== undefined) fields.runs_business = runsBusiness;
  if (interests !== undefined) fields.interests = interests;
  if (tags !== undefined) fields.tags = tags;

  const ok = Object.values(fields).every((field) => field.ok);
  return { status: ok ? 200 : 422, body: { ok, fields } };
}

function parseSubscriberUpdate(
  body: unknown,
): { ok: true; value: ParsedSubscriberUpdate } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: 'Invalid JSON body' };
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return { ok: false, error: 'A valid email is required' };
  }

  const postcode = parsePostcode(body.postcode);
  if (!postcode.ok) return { ok: false, error: postcode.error };

  const runsBusiness = parseRunsBusiness(body.runs_business);
  if (!runsBusiness.ok) return { ok: false, error: runsBusiness.error };

  const interests = parseInterestList(body.interests, 'interests');
  if (!interests.ok) return { ok: false, error: interests.error };

  const tags = parseInterestList(body.tags, 'tags');
  if (!tags.ok) return { ok: false, error: tags.error };

  return {
    ok: true,
    value: {
      email,
      postcode: postcode.value,
      runsBusiness: runsBusiness.value,
      interests: interests.value,
      tags: tags.value,
    },
  };
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}

function parsePostcode(
  value: unknown,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined) return { ok: true };
  if (typeof value !== 'string') return { ok: false, error: 'Invalid postcode' };
  const postcode = value.trim();
  if (!postcode) return { ok: true };
  if (postcode.length > MAX_POSTCODE_LENGTH || /[\u0000-\u001F\u007F]/.test(postcode)) {
    return { ok: false, error: 'Invalid postcode' };
  }
  return { ok: true, value: postcode };
}

function parseRunsBusiness(
  value: unknown,
): { ok: true; value?: BusinessStatus } | { ok: false; error: string } {
  if (value === undefined) return { ok: true };
  if (value === 'yes' || value === 'no') return { ok: true, value };
  return { ok: false, error: 'runs_business must be yes or no' };
}

function parseInterestList(
  value: unknown,
  field: 'interests' | 'tags',
): { ok: true; value?: InterestId[] } | { ok: false; error: string } {
  if (value === undefined) return { ok: true };
  if (!Array.isArray(value)) {
    return { ok: false, error: field === 'tags' ? 'Invalid tags' : 'Invalid interests' };
  }
  if (value.length === 0) {
    if (field === 'tags') return { ok: true };
    return { ok: false, error: 'Invalid interests' };
  }
  if (field === 'tags' && value.length > MAX_TAGS) {
    return { ok: false, error: 'At most three tags can be saved' };
  }

  const ids: InterestId[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string' || !ALLOWED_INTEREST_SET.has(entry)) {
      return { ok: false, error: field === 'tags' ? 'Unknown tag' : 'Unknown interest' };
    }
    if (seen.has(entry)) {
      return { ok: false, error: field === 'tags' ? 'Duplicate tag' : 'Duplicate interest' };
    }
    seen.add(entry);
    ids.push(entry as InterestId);
  }
  return { ok: true, value: ids };
}

async function putCustomField(
  client: BeehiivClient,
  path: string,
  name: CustomFieldName,
  value: string,
): Promise<FieldResult> {
  try {
    const result = await client({
      path,
      method: 'PUT',
      body: { custom_fields: [{ name, value }] },
    });
    if (!result.ok) {
      return { ok: false, error: result.status === 404 ? 'Subscriber not found' : updateError(name) };
    }
    if (!isRecord(result.body)) {
      return { ok: false, error: updateError(name) };
    }
    if (hasWarnings(result.body)) {
      return { ok: false, error: ignoredError(name) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: updateError(name) };
  }
}

async function addTags(
  client: BeehiivClient,
  publicationId: string,
  byEmailPath: string,
  tags: readonly InterestId[],
): Promise<FieldResult> {
  try {
    const subscription = await client({ path: byEmailPath, method: 'GET' });
    const subscriptionId = readSubscriptionId(subscription.ok ? subscription.body : null);
    if (!subscriptionId) {
      return { ok: false, error: 'Subscriber not found' };
    }

    const result = await client({
      path: `/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
      method: 'POST',
      body: { tags: [...tags] },
    });
    if (!result.ok || !isRecord(result.body) || hasWarnings(result.body)) {
      return { ok: false, error: 'Could not add tags' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not add tags' };
  }
}

function readSubscriptionId(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.data)) return null;
  const id = body.data.id;
  if (typeof id !== 'string' || !SUBSCRIPTION_ID_PATTERN.test(id)) return null;
  return id;
}

function hasWarnings(body: Record<string, unknown>): boolean {
  return Array.isArray(body.warnings) && body.warnings.length > 0;
}

function updateError(field: CustomFieldName): string {
  switch (field) {
    case 'postcode':
      return 'Could not update postcode';
    case 'runs_business':
      return 'Could not update business status';
    case 'interests':
      return 'Could not update interests';
    default: {
      const unreachable: never = field;
      return unreachable;
    }
  }
}

function ignoredError(field: CustomFieldName): string {
  switch (field) {
    case 'postcode':
      return 'Beehiiv did not save postcode';
    case 'runs_business':
      return 'Beehiiv did not save business status';
    case 'interests':
      return 'Beehiiv did not save interests';
    default: {
      const unreachable: never = field;
      return unreachable;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
