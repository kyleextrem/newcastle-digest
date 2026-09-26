import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import type { TypedObject } from '@portabletext/types'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2025-01-01'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export type SanityImage = {
  asset?: { _ref?: string; _id?: string }
  alt?: string
  caption?: string
}

export type ContentSection = 'journal' | 'getaways'

export type JournalCategory = {
  _id: string
  title: string
  slug: string
  description?: string
}

export type JournalAuthor = {
  _id: string
  name: string
  bio?: string
  photo?: SanityImage
}

export type JournalDestination = {
  title: string
  slug: string
}

export type GetawayDestination = {
  _id: string
  title: string
  slug: string
  description?: string
}

export type JournalPost = {
  _id: string
  title: string
  slug: string
  section?: ContentSection | null
  publishedAt: string
  updatedAt?: string
  excerpt: string
  seoTitle?: string
  seoDescription?: string
  tripType?: string
  coverImage?: SanityImage
  category?: {
    title: string
    slug: string
  }
  destination?: JournalDestination
  author?: {
    name: string
  }
  body?: TypedObject[]
}

const postFields = `
  _id,
  title,
  "slug": slug.current,
  "section": select(section == "getaways" => "getaways", "journal"),
  publishedAt,
  updatedAt,
  excerpt,
  seoTitle,
  seoDescription,
  coverImage,
  category->{ title, "slug": slug.current },
  destination->{ title, "slug": slug.current },
  author->{ name }
`

const publishedPost = `_type == "post" && defined(slug.current) && defined(publishedAt)`
const journalPost = `${publishedPost} && coalesce(section, "journal") == "journal"`
const getawayPost = `${publishedPost} && section == "getaways"`

export const postsQuery = `*[${journalPost}] | order(publishedAt desc) {
  ${postFields}
}`

export const recentPostsQuery = `*[${journalPost}] | order(publishedAt desc)[0...3] {
  ${postFields}
}`

export const postBySlugQuery = `*[${journalPost} && slug.current == $slug][0] {
  ${postFields},
  body
}`

export const postSlugsQuery = `*[${journalPost}]{ "slug": slug.current }`

export type SitemapPost = {
  slug: string
  lastModified: string
  section: ContentSection
}

export const sitemapPostsQuery = `*[${publishedPost}]{
  "slug": slug.current,
  "lastModified": coalesce(_updatedAt, publishedAt),
  "section": select(section == "getaways" => "getaways", "journal")
}`

export const relatedPostsQuery = `*[${journalPost} && slug.current != $slug] | order(select(category->slug.current == $categorySlug => 0, 1) asc, publishedAt desc)[0...3] {
  ${postFields}
}`

export const getawaysQuery = `*[${getawayPost}] | order(publishedAt desc) {
  ${postFields}
}`

export const latestGetawayQuery = `*[${getawayPost}] | order(publishedAt desc)[0] {
  ${postFields}
}`

export const getawayBySlugQuery = `*[${getawayPost} && slug.current == $slug][0] {
  ${postFields},
  tripType,
  body
}`

export const getawaySlugsQuery = `*[${getawayPost}]{ "slug": slug.current }`

export const relatedGetawaysQuery = `*[${getawayPost} && slug.current != $slug] | order(select(destination->slug.current == $destinationSlug => 0, 1) asc, publishedAt desc)[0...3] {
  ${postFields}
}`

export const destinationsWithGetawaysQuery = `*[_type == "destination" && _id in *[${getawayPost}].destination._ref] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description
}`

export const categoriesQuery = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description
}`

export async function getPosts(): Promise<JournalPost[]> {
  if (!projectId) return []
  try {
    return await client.fetch(postsQuery)
  } catch {
    return []
  }
}

export async function getRecentPosts(): Promise<JournalPost[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(recentPostsQuery)
  } catch {
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<JournalPost | null> {
  if (!projectId) return null
  try {
    return await client.fetch(postBySlugQuery, { slug })
  } catch {
    return null
  }
}

export async function getPostSlugs(): Promise<{ slug: string }[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(postSlugsQuery)
  } catch {
    return []
  }
}

export async function getSitemapPosts(): Promise<SitemapPost[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(sitemapPostsQuery)
  } catch {
    return []
  }
}

export async function getRelatedPosts(slug: string, categorySlug?: string): Promise<JournalPost[]> {
  if (!projectId) return []
  try {
    return await client.fetch(relatedPostsQuery, { slug, categorySlug: categorySlug ?? '' })
  } catch {
    return []
  }
}

export async function getCategories(): Promise<JournalCategory[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(categoriesQuery)
  } catch {
    return []
  }
}

export async function getGetaways(): Promise<JournalPost[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(getawaysQuery)
  } catch {
    return []
  }
}

export async function getLatestGetaway(): Promise<JournalPost | null> {
  if (!projectId || projectId === 'your_project_id') return null
  try {
    return await client.fetch(latestGetawayQuery)
  } catch {
    return null
  }
}

export async function getGetawayBySlug(slug: string): Promise<JournalPost | null> {
  if (!projectId) return null
  try {
    return await client.fetch(getawayBySlugQuery, { slug })
  } catch {
    return null
  }
}

export async function getGetawaySlugs(): Promise<{ slug: string }[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(getawaySlugsQuery)
  } catch {
    return []
  }
}

export async function getRelatedGetaways(slug: string, destinationSlug?: string): Promise<JournalPost[]> {
  if (!projectId) return []
  try {
    return await client.fetch(relatedGetawaysQuery, { slug, destinationSlug: destinationSlug ?? '' })
  } catch {
    return []
  }
}

export async function getDestinationsWithGetaways(): Promise<GetawayDestination[]> {
  if (!projectId || projectId === 'your_project_id') return []
  try {
    return await client.fetch(destinationsWithGetawaysQuery)
  } catch {
    return []
  }
}
