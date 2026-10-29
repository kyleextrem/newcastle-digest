import type { MetadataRoute } from 'next';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { listPublicEditions } from '@/lib/beehiiv';
import { getSitemapPosts, type SitemapPost } from '@/lib/sanity';
import { SITE_URL } from '@/lib/site';

const EXCLUDED_PATHS = new Set(['/thank-you', '/studio', '/support/success', '/latest']);

function articlePath(section: SitemapPost['section']): 'journal' | 'getaways' {
  switch (section) {
    case 'getaways':
      return 'getaways';
    case 'journal':
      return 'journal';
    default: {
      const unreachable: never = section;
      return unreachable;
    }
  }
}

function sourceModified(relativePath: string) {
  return statSync(join(process.cwd(), relativePath)).mtime;
}

function isIndexable(url: string) {
  const path = new URL(url).pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/api') || path.startsWith('/studio')) return false;
  return !EXCLUDED_PATHS.has(path);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/subscribe`,
      lastModified: sourceModified('app/subscribe/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${SITE_URL}/getaways`,
      lastModified: sourceModified('app/getaways/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: sourceModified('app/events/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: sourceModified('app/shop/(storefront)/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/experiences`,
      lastModified: sourceModified('app/experiences/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/behind`,
      lastModified: sourceModified('app/behind/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: sourceModified('app/work/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: sourceModified('app/jobs/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: sourceModified('app/contact/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: sourceModified('app/support/page.tsx'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/previous-newsletters`,
      lastModified: sourceModified('app/previous-newsletters/page.tsx'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: sourceModified('app/privacy/page.tsx'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const posts = await getSitemapPosts();
  const articleRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/${articlePath(post.section)}/${post.slug}`,
    ...(post.lastModified ? { lastModified: new Date(post.lastModified) } : {}),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const editions = await listPublicEditions();
  const editionRoutes: MetadataRoute.Sitemap = editions.map((edition) => ({
    url: `${SITE_URL}/previous-newsletters/${edition.slug}`,
    ...(edition.publishedAt ? { lastModified: new Date(edition.publishedAt) } : {}),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes, ...editionRoutes].filter((entry) => isIndexable(entry.url));
}
