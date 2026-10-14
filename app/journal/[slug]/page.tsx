import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorialLink, EditorialLinks } from '@/components/EditorialLinks'
import { JournalCard } from '@/components/JournalCard'
import { JournalPortableText } from '@/components/JournalPortableText'
import { NewsletterSubscribeCta } from '@/components/NewsletterSubscribeCta'
import {
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
  urlFor,
} from '@/lib/sanity'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((item) => ({ slug: item.slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt
  const canonical = `/journal/${slug}`
  const ogImage = post.coverImage
    ? urlFor(post.coverImage).width(1200).height(630).fit('crop').url()
    : DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'en_AU',
      siteName: SITE_NAME,
      url: canonical,
      publishedTime: post.publishedAt,
      ...(post._updatedAt || post.updatedAt
        ? { modifiedTime: post._updatedAt || post.updatedAt }
        : {}),
      images: [{ url: ogImage }],
    },
    twitter: {
      title,
      description,
      images: [ogImage],
    },
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const related = await getRelatedPosts(slug, post.category?.slug)
  const coverUrl = post.coverImage
    ? urlFor(post.coverImage).width(1600).height(900).fit('crop').url()
    : null
  const canonicalUrl = `${SITE_URL}/journal/${slug}`
  const showPlanYourWeek = slug !== 'newcastle-gig-guide' && slug !== 'newcastle-markets-guide'
  const articleSchema = articleJsonLd({
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.updatedAt,
    image: coverUrl || undefined,
    authorName: post.author?.name,
    canonicalUrl,
  })
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'The Journal', url: `${SITE_URL}/journal` },
    { name: post.title, url: canonicalUrl },
  ])

  return (
    <article className="bg-[#faf9f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {coverUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f5f4f0] md:aspect-[21/9]">
          <Image
            src={coverUrl}
            alt={post.coverImage?.alt || post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/journal"
            className="mb-8 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
          >
            ← Newcastle Digest Journal
          </Link>
        </div>
        <div className="container mx-auto max-w-3xl text-center">
          {post.category?.title && (
            <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
              {post.category.title}
            </p>
          )}

          <h1 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.95] text-[#251f18] md:text-6xl lg:text-7xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            )}
            {post.author?.name && <span>{post.author.name}</span>}
          </div>
        </div>

        {post.body && Array.isArray(post.body) && (
          <div className="mt-12 md:mt-16">
            <JournalPortableText value={post.body} />
          </div>
        )}

        {slug === 'newcastle-gig-guide' ? (
          <EditorialLinks>
            This guide is updated each Wednesday from the weekly email.{' '}
            <EditorialLink href="/previous-newsletters">
              Browse previous Newcastle Digest editions
            </EditorialLink>
            , or see this week&apos;s{' '}
            <EditorialLink href="/journal/newcastle-markets-guide">
              Newcastle Markets Guide
            </EditorialLink>
            .
          </EditorialLinks>
        ) : null}

        {slug === 'newcastle-markets-guide' ? (
          <EditorialLinks>
            This guide is updated each Wednesday from the weekly email.{' '}
            <EditorialLink href="/previous-newsletters">
              Browse previous Newcastle Digest editions
            </EditorialLink>
            , or see this week&apos;s{' '}
            <EditorialLink href="/journal/newcastle-gig-guide">
              Newcastle Gig Guide
            </EditorialLink>
            .
          </EditorialLinks>
        ) : null}

        {post.category?.slug === 'guides' ? (
          <EditorialLinks>
            More local stories and weekly guides live in the{' '}
            <EditorialLink href="/journal">Newcastle Digest Journal</EditorialLink>
            . For past weekly emails,{' '}
            <EditorialLink href="/previous-newsletters">
              browse previous Newcastle Digest editions
            </EditorialLink>
            .
          </EditorialLinks>
        ) : null}

        {showPlanYourWeek ? (
          <EditorialLinks>
            Plan your week with the{' '}
            <EditorialLink href="/journal/newcastle-gig-guide">Newcastle Gig Guide</EditorialLink>
            , the{' '}
            <EditorialLink href="/journal/newcastle-markets-guide">Newcastle Markets Guide</EditorialLink>
            ,{' '}
            <EditorialLink href="/jobs">jobs in Newcastle</EditorialLink>
            , the{' '}
            <EditorialLink href="https://events.newcastledigest.com">Newcastle events directory</EditorialLink>
            , or{' '}
            <EditorialLink href="/subscribe">subscribe to the weekly email</EditorialLink>
            .
          </EditorialLinks>
        ) : null}

        <div className="mx-auto mt-16 max-w-3xl md:mt-20">
          <NewsletterSubscribeCta location="journal_article" />
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-[#251f18]/06 px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-10 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:mb-14 md:text-4xl">
              More from The Journal
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {related.map((item) => (
                <JournalCard key={item._id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
