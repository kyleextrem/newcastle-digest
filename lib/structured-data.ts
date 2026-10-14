import { DEFAULT_OG_IMAGE, LOGO_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';

export function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export type ArticleSchemaInput = {
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
  canonicalUrl: string;
};

export function articleJsonLd(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    mainEntityOfPage: absoluteUrl(input.canonicalUrl),
    image: absoluteUrl(input.image || DEFAULT_OG_IMAGE),
    ...(input.authorName ? { author: { '@type': 'Person', name: input.authorName } } : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(LOGO_IMAGE),
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}
