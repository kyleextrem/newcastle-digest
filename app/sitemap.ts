import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.newcastledigest.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/subscribe`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/journal`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/experiences`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/behind`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/work`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/previous-newsletters`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return routes.map((route) => ({
    ...route,
    lastModified: new Date(),
  }));
}
