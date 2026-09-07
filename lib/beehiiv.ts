const BEEHIIV_API = 'https://api.beehiiv.com/v2';

export type BeehiivPostStatus = 'draft' | 'confirmed' | 'archived';
export type BeehiivAudience = 'free' | 'premium' | 'both';
export type BeehiivPlatform = 'web' | 'email' | 'both';

export type BeehiivPost = {
  id: string;
  title: string;
  subtitle?: string;
  subject_line?: string;
  preview_text?: string;
  web_url: string;
  publish_date?: number;
  displayed_date?: number;
  slug: string;
  status?: BeehiivPostStatus;
  audience?: BeehiivAudience;
  platform?: BeehiivPlatform;
  hidden_from_feed?: boolean;
  enforce_gated_content?: boolean;
  thumbnail_url?: string;
  cover_image_url?: string;
  thumbnail_image_url?: string;
  meta_default_description?: string;
  meta_default_title?: string;
  content?: {
    free?: {
      web?: string;
      email?: string;
      rss?: string;
    };
  };
};

type BeehiivPostsResponse = {
  data: BeehiivPost[];
  limit: number;
  page: number;
  total_results: number;
  total_pages: number;
};

export type NewsletterEditionSummary = {
  id: string;
  title: string;
  slug: string;
  webUrl: string;
  publishedAt: string;
  subtitle: string;
  thumbnailUrl: string | null;
};

export type NewsletterEdition = NewsletterEditionSummary & {
  html: string;
  previewText: string;
  seoTitle?: string;
  seoDescription?: string;
};

function getCredentials(): { apiKey: string; publicationId: string } | null {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) return null;
  return { apiKey, publicationId };
}

export function isBeehiivConfigured(): boolean {
  return getCredentials() !== null;
}

function unixToIso(value?: number): string {
  if (!value) return '';
  return new Date(value * 1000).toISOString();
}

function pickThumbnail(post: BeehiivPost): string | null {
  return post.thumbnail_url ?? post.cover_image_url ?? post.thumbnail_image_url ?? null;
}

export function isPublicWebEdition(post: BeehiivPost): boolean {
  if (!post.slug) return false;
  if (post.status && post.status !== 'confirmed') return false;
  if (post.platform === 'email') return false;
  if (post.audience === 'premium') return false;
  if (post.enforce_gated_content) return false;
  if (typeof post.publish_date === 'number' && post.publish_date * 1000 > Date.now() + 60_000) {
    return false;
  }
  return true;
}

export function toEditionSummary(post: BeehiivPost): NewsletterEditionSummary {
  return {
    id: post.id,
    title: post.title || post.subject_line || '',
    slug: post.slug,
    webUrl: post.web_url ?? '',
    publishedAt: unixToIso(post.displayed_date ?? post.publish_date),
    subtitle: post.subtitle ?? post.preview_text ?? '',
    thumbnailUrl: pickThumbnail(post),
  };
}

async function beehiivGet(path: string, search: URLSearchParams, revalidate: number) {
  const credentials = getCredentials();
  if (!credentials) return null;

  const url = new URL(`${BEEHIIV_API}${path}`);
  search.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      Accept: 'application/json',
    },
    next: { revalidate },
  });

  if (!res.ok) {
    return null;
  }

  return res;
}

async function fetchPostsPage(options: {
  page: number;
  limit: number;
  slug?: string;
  expand?: string[];
  contentTag?: string;
  revalidate: number;
}): Promise<BeehiivPostsResponse | null> {
  const credentials = getCredentials();
  if (!credentials) return null;

  const search = new URLSearchParams();
  search.set('status', 'confirmed');
  search.set('order_by', 'publish_date');
  search.set('direction', 'desc');
  search.set('limit', String(options.limit));
  search.set('page', String(options.page));
  if (options.slug) {
    search.append('slugs[]', options.slug);
  }
  if (options.contentTag) {
    search.append('content_tags[]', options.contentTag);
  }
  for (const value of options.expand ?? []) {
    search.append('expand', value);
  }

  const res = await beehiivGet(
    `/publications/${credentials.publicationId}/posts`,
    search,
    options.revalidate
  );
  if (!res) return null;
  return (await res.json()) as BeehiivPostsResponse;
}

export async function listPublicEditions(): Promise<NewsletterEditionSummary[]> {
  if (!getCredentials()) return [];

  const editions: NewsletterEditionSummary[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const body = await fetchPostsPage({
      page,
      limit: 100,
      revalidate: 3600,
    });
    if (!body) break;

    for (const post of body.data ?? []) {
      if (isPublicWebEdition(post)) {
        editions.push(toEditionSummary(post));
      }
    }

    totalPages = body.total_pages || 1;
    page += 1;
  } while (page <= totalPages && page <= 20);

  return editions;
}

export async function listPublicEditionApiItems(limit = 50, contentTag?: string) {
  const body = await fetchPostsPage({
    page: 1,
    limit,
    contentTag,
    revalidate: 900,
  });

  return (body?.data ?? []).filter(isPublicWebEdition).map(mapIssueApiItem);
}

export async function getLatestPublicEdition() {
  const body = await fetchPostsPage({
    page: 1,
    limit: 10,
    revalidate: 300,
  });
  const post = (body?.data ?? []).find(isPublicWebEdition);
  if (!post) return null;

  return {
    title: post.title,
    url: post.web_url,
    publish_date: unixToIso(post.publish_date),
  };
}

export async function getPublicEditionBySlug(slug: string): Promise<NewsletterEdition | null> {
  if (!slug || !getCredentials()) return null;

  const body = await fetchPostsPage({
    page: 1,
    limit: 1,
    slug,
    expand: ['free_web_content', 'free_rss_content'],
    revalidate: 3600,
  });

  const post = body?.data?.[0];
  if (!post || !isPublicWebEdition(post) || post.slug !== slug) {
    return null;
  }

  const summary = toEditionSummary(post);
  return {
    ...summary,
    html: extractEditionHtml(post),
    previewText: post.preview_text ?? post.subtitle ?? '',
    seoTitle: post.meta_default_title || undefined,
    seoDescription: post.meta_default_description || undefined,
  };
}

function extractElementInnerHtml(html: string, id: string): string | null {
  const open = html.match(new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)([^>]*\\sid=["']${id}["'][^>]*)>`, 'i'));
  if (!open || open.index === undefined) return null;

  const tagName = open[1];
  let index = open.index + open[0].length;
  let depth = 1;
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tagName}>`, 'gi');

  while (depth > 0 && index < html.length) {
    openRe.lastIndex = index;
    closeRe.lastIndex = index;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) return null;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      index = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      if (depth === 0) {
        return html.slice(open.index + open[0].length, nextClose.index);
      }
      index = nextClose.index + nextClose[0].length;
    }
  }

  return null;
}

function extractBodyHtml(html: string): string | null {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : null;
}

function sanitizeEditionHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');
}

function extractEditionHtml(post: BeehiivPost): string {
  const web = post.content?.free?.web ?? '';
  const rss = post.content?.free?.rss ?? '';
  const fromBlocks = web ? extractElementInnerHtml(web, 'content-blocks') : null;
  const fromBody = web ? extractBodyHtml(web) : null;
  const raw = fromBlocks || rss || fromBody || web || '';
  const sanitized = sanitizeEditionHtml(raw).trim();
  if (sanitized) return sanitized;

  const fallback = [post.subtitle, post.preview_text]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => `<p>${escapeHtml(value.trim())}</p>`)
    .join('');
  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function excerptFromHtml(html: string, maxLength = 155): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}...`;
}

export function formatEditionDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function mapIssueApiItem(post: BeehiivPost) {
  const summary = toEditionSummary(post);
  return {
    title: summary.title,
    slug: summary.slug,
    web_url: summary.webUrl,
    published_at: summary.publishedAt,
    subtitle: summary.subtitle,
    thumbnail_url: summary.thumbnailUrl,
  };
}
