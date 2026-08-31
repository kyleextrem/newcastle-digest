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

export type JournalPost = {
  _id: string
  title: string
  slug: string
  publishedAt: string
  excerpt: string
  seoTitle?: string
  seoDescription?: string
  coverImage?: SanityImage
  category?: {
    title: string
    slug: string
  }
  author?: {
    name: string
  }
    body?: TypedObject[]
}

const postFields = `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  seoTitle,
  seoDescription,
  coverImage,
  category->{ title, "slug": slug.current },
  author->{ name }
`

export const postsQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) {
  ${postFields}
}`

export const recentPostsQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc)[0...3] {
  ${postFields}
}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  ${postFields},
  body
}`

export const postSlugsQuery = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`

export const relatedPostsQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt) && slug.current != $slug] | order(publishedAt desc)[0...3] {
  ${postFields}
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

export async function getRelatedPosts(slug: string): Promise<JournalPost[]> {
  if (!projectId) return []
  try {
    return await client.fetch(relatedPostsQuery, { slug })
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
