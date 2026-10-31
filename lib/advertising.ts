export const FEATURED_EVENT_URL = 'https://events.newcastledigest.com/feature';
export const ADVERTISING_PIPELINE_LABEL = 'Newcastle Digest Sponsorships';

export const ADVERTISING_PACKAGES = [
  'newsletter-feature',
  'sponsored-article',
  'launch-package',
  'category-sponsorship',
  'monthly-partner',
  'ongoing',
  'campaigns',
  'partnership',
  'unsure',
] as const;

export type AdvertisingPackage = (typeof ADVERTISING_PACKAGES)[number];

export const PROMOTION_GOALS = ['opening', 'offer', 'visibility', 'event', 'other'] as const;

export type PromotionGoal = (typeof PROMOTION_GOALS)[number];

export type AdvertisingEnquiryInput = {
  name: string;
  email: string;
  businessName: string;
  goal: PromotionGoal;
  packageId: AdvertisingPackage;
  details: string;
  source: 'work' | 'contact';
};

const LIMITS = {
  name: 100,
  email: 254,
  businessName: 120,
  details: 2000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isAdvertisingPackage(value: string): value is AdvertisingPackage {
  return (ADVERTISING_PACKAGES as readonly string[]).includes(value);
}

export function isPromotionGoal(value: string): value is PromotionGoal {
  return (PROMOTION_GOALS as readonly string[]).includes(value);
}

/** Full rate card. Public cards use `summary` only. Prices here are the source of truth. */
export const ADVERTISING_OFFERS = [
  {
    id: 'newsletter-feature',
    name: 'Newsletter Feature',
    priceLabel: '$250 one-off',
    suits: 'For a business with one thing to put in front of readers.',
    summary: [
      'One feature in a Wednesday newsletter.',
      '80–120 words, an image, and your logo.',
      'A button linking to your business.',
    ],
    inclusions: [
      'One sponsored feature in a Wednesday newsletter.',
      'Copy of 80–120 words, written in our voice.',
      'An image you supply, or one we source.',
      'Your logo and a “Brought to you by” line.',
      'A button linking to your business.',
    ],
  },
  {
    id: 'sponsored-article',
    name: 'Sponsored Article',
    priceLabel: '$400 one-off',
    suits: 'For a business that wants a story people can find again.',
    summary: [
      'A Journal article of 400–600 words.',
      'On the site, and mentioned in that week’s newsletter.',
      'One link back to your website.',
    ],
    inclusions: [
      'A dedicated article in the Newcastle Digest Journal.',
      '400–600 words, written by Newcastle Digest.',
      'Published on the site, and promoted in that week’s newsletter.',
      'Written with your business name and location.',
      'One link back to your website.',
    ],
  },
  {
    id: 'ongoing',
    name: 'Ongoing Advertising',
    priceLabel: 'From $300/month',
    suits: 'For a business that wants regular visibility, not a single appearance.',
    summary: [
      'A place in the newsletter beyond one edition.',
      'Category, monthly, quarterly and yearly options, priced separately.',
      'We’ll reply with the option and the price.',
    ],
    inclusions: [
      'Category Sponsorship, $300/month. Logo and a one-line description on Journal articles in one category, plus a sponsor line in the matching newsletter section each week. Categories: Food, Markets, Events, Gigs. One sponsor per category, for a calendar month.',
      'Monthly Partner, $500/month. One feature in an edition you choose, a supporter line in every edition that month, and priority scheduling.',
      'Quarterly Partner, price on enquiry. Three features, one a month, a supporter line in every edition that quarter, priority scheduling, and a report at the end.',
      'Yearly Anchor, price on enquiry. A feature each month, a supporter line all year, one sponsored Journal article, quarterly reports, and no competitor in your category while you hold it.',
    ],
  },
  {
    id: 'campaigns',
    name: 'Campaigns & Partnerships',
    priceLabel: 'Tailored pricing',
    suits: 'For a launch, a few weeks of promotion, or a partnership across more than one channel.',
    summary: [
      'A four-week launch, or a custom plan.',
      'Newsletter and Journal in one engagement.',
      'We’ll reply with a plan and a price.',
    ],
    inclusions: [
      'Launch Package, $600 over four weeks. One feature, a supporter line across four or five editions, one sponsored Journal article, and priority scheduling.',
      'Custom Engagement, tailored quote. A bigger launch, a series, or a mix of newsletter, Journal and events. We reply with a plan and a price.',
    ],
  },
] as const;

export function packageLabel(packageId: AdvertisingPackage): string {
  switch (packageId) {
    case 'newsletter-feature':
      return 'Newsletter Feature';
    case 'sponsored-article':
      return 'Sponsored Article';
    case 'launch-package':
      return 'Launch Package';
    case 'category-sponsorship':
      return 'Category Sponsorship';
    case 'monthly-partner':
      return 'Monthly Partner';
    case 'ongoing':
      return 'Ongoing Advertising';
    case 'campaigns':
      return 'Campaigns & Partnerships';
    case 'partnership':
      return 'Long-term partnership';
    case 'unsure':
      return 'Not sure yet';
    default: {
      const unreachable: never = packageId;
      return unreachable;
    }
  }
}

export function goalLabel(goal: PromotionGoal): string {
  switch (goal) {
    case 'opening':
      return 'A new opening or launch';
    case 'offer':
      return 'A product, menu or offer';
    case 'visibility':
      return 'Staying in front of locals';
    case 'event':
      return 'An event';
    case 'other':
      return 'Something else';
    default: {
      const unreachable: never = goal;
      return unreachable;
    }
  }
}

export function firstNameFrom(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first;
}

export function validateAdvertisingEnquiry(
  value: unknown,
): { ok: true; enquiry: AdvertisingEnquiryInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Check the form and try again.' };
  }

  const body = value as Record<string, unknown>;
  const name = readString(body.name);
  const email = readString(body.email).toLowerCase();
  const businessName = readString(body.businessName);
  const goal = readString(body.goal);
  const packageId = readString(body.packageId);
  const details = readString(body.details);
  const source = readString(body.source);

  if (!name || !email || !businessName || !goal || !packageId) {
    return { ok: false, error: 'Name, email, business name and what you want to promote are required.' };
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    businessName.length > LIMITS.businessName ||
    details.length > LIMITS.details
  ) {
    return { ok: false, error: 'One of the fields is too long.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  if (!isPromotionGoal(goal)) {
    return { ok: false, error: 'Choose what you would like to promote.' };
  }

  if (!isAdvertisingPackage(packageId)) {
    return { ok: false, error: 'Choose an advertising option.' };
  }

  if (source !== 'work' && source !== 'contact') {
    return { ok: false, error: 'Check the form and try again.' };
  }

  return {
    ok: true,
    enquiry: {
      name,
      email,
      businessName,
      goal,
      packageId,
      details,
      source,
    },
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
