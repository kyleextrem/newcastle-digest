import type { MetadataRoute } from 'next';
import { listPublicEditions } from '@/lib/beehiiv';
import { getSitemapPosts, type SitemapPost } from '@/lib/sanity';
import { SITE_URL } from '@/lib/site';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/subscribe`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/getaways`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/experiences`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/behind`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/work`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/jobs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/previous-newsletters`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const posts = await getSitemapPosts();
  const articleRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/${articlePath(post.section)}/${post.slug}`,
    lastModified: post.lastModified ? new Date(post.lastModified) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const editions = await listPublicEditions();
  const editionRoutes: MetadataRoute.Sitemap = editions.map((edition) => ({
    url: `${SITE_URL}/previous-newsletters/${edition.slug}`,
    lastModified: edition.publishedAt ? new Date(edition.publishedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes, ...editionRoutes];
}
