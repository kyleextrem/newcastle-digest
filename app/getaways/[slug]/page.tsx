import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorialLink, EditorialLinks } from '@/components/EditorialLinks'
import { JournalCard } from '@/components/JournalCard'
import { JournalPortableText } from '@/components/JournalPortableText'
import {
  getGetawayBySlug,
  getGetawaySlugs,
  getRecentPosts,
  getRelatedGetaways,
  urlFor,
} from '@/lib/sanity'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export const revalidate = 3600

const TRIP_TYPE_LABELS: Record<string, string> = {
  'weekend-trips': 'Weekend trips',
  hotels: 'Hotels',
  'food-drink': 'Food & drink',
  'road-trips': 'Road trips',
  'things-to-do': 'Things to do',
  itineraries: 'Itineraries',
  couples: 'Couples',
  family: 'Family',
  luxury: 'Luxury',
  budget: 'Budget',
}

export async function generateStaticParams() {
  const slugs = await getGetawaySlugs()
  return slugs.map((item) => ({ slug: item.slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function showUpdated(publishedAt?: string, updatedAt?: string) {
  if (!updatedAt) return false
  if (!publishedAt) return true
  return formatDate(publishedAt) !== formatDate(updatedAt)
}

function tripTypeLabel(value?: string) {
  if (!value) return undefined
  return TRIP_TYPE_LABELS[value]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getGetawayBySlug(slug)

  if (!post) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt
  const canonical = `/getaways/${slug}`
  const ogImage = post.coverImage
    ? urlFor(post.coverImage).width(1200).height(630).fit('crop').url()
    : undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'en_AU',
      siteName: SITE_NAME,
      url: canonical,
      publishedTime: post.publishedAt,
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function GetawayArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await getGetawayBySlug(slug)

  if (!post) {
    notFound()
  }

  const [relatedGetaways, relatedJournal] = await Promise.all([
    getRelatedGetaways(slug, post.destination?.slug),
    getRecentPosts(),
  ])
  const coverUrl = post.coverImage
    ? urlFor(post.coverImage).width(2000).height(1200).fit('crop').url()
    : null
  const canonicalUrl = `${SITE_URL}/getaways/${slug}`
  const description = post.seoDescription || post.excerpt
  const typeLabel = tripTypeLabel(post.tripType)
  const updated = showUpdated(post.publishedAt, post.updatedAt)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: description || undefined,
    datePublished: post.publishedAt || undefined,
    ...(updated && post.updatedAt ? { dateModified: post.updatedAt } : {}),
    mainEntityOfPage: canonicalUrl,
    image: coverUrl || `${SITE_URL}/nd-logo.png`,
    ...(post.author?.name
      ? { author: { '@type': 'Person', name: post.author.name } }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/nd-logo.png`,
      },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Getaways', item: `${SITE_URL}/getaways` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  }

  return (
    <article className="bg-[#faf9f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {coverUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f4f0] md:aspect-[2/1]">
          <Image
            src={coverUrl}
            alt={post.coverImage?.alt || post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-main text-[10px] uppercase tracking-widest">
              <li>
                <Link href="/" className="text-[#849bff] hover:opacity-70">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-[#251f18]/30">
                /
              </li>
              <li>
                <Link href="/getaways" className="text-[#849bff] hover:opacity-70">
                  Getaways
                </Link>
              </li>
              <li aria-hidden="true" className="text-[#251f18]/30">
                /
              </li>
              <li className="text-[#251f18]/50">{post.title}</li>
            </ol>
          </nav>
        </div>

        <div className="container mx-auto max-w-3xl text-center">
          {post.destination?.title ? (
            <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
              {post.destination.title}
            </p>
          ) : null}

          <h1 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.95] text-[#251f18] md:text-6xl lg:text-7xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mx-auto mt-6 max-w-2xl font-sans-main text-lg leading-relaxed text-[#251f18]/65 md:text-xl">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50">
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            ) : null}
            {updated && post.updatedAt ? (
              <time dateTime={post.updatedAt}>Updated {formatDate(post.updatedAt)}</time>
            ) : null}
            {post.author?.name ? <span>{post.author.name}</span> : null}
            {typeLabel ? <span>{typeLabel}</span> : null}
          </div>
        </div>

        {post.body && Array.isArray(post.body) ? (
          <div className="mt-12 md:mt-16">
            <JournalPortableText value={post.body} />
          </div>
        ) : null}

        <div className="container mx-auto max-w-3xl">
          <EditorialLinks>
            More places to escape to live in{' '}
            <EditorialLink href="/getaways">Getaways</EditorialLink>. For what&apos;s on in
            Newcastle, read the <EditorialLink href="/journal">Journal</EditorialLink>.
          </EditorialLinks>
        </div>
      </div>

      {relatedGetaways.length > 0 ? (
        <section className="border-t border-[#251f18]/06 px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-10 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:mb-14 md:text-4xl">
              More Getaways
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {relatedGetaways.map((item) => (
                <JournalCard key={item._id} post={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedJournal.length > 0 ? (
        <section className="border-t border-[#251f18]/06 px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-10 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:mb-14 md:text-4xl">
              From the Journal
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {relatedJournal.map((item) => (
                <JournalCard key={item._id} post={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  )
}
