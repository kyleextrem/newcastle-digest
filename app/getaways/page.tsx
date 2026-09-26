import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GetawaysDirectory } from '@/components/GetawaysDirectory'
import { NewsletterSubscribeCta } from '@/components/NewsletterSubscribeCta'
import {
  getDestinationsWithGetaways,
  getGetaways,
  getLatestGetaway,
  urlFor,
  type JournalPost,
} from '@/lib/sanity'
import { SITE_NAME } from '@/lib/site'

export const revalidate = 3600

const DESCRIPTION = 'Places worth escaping to from Newcastle.'

export async function generateMetadata(): Promise<Metadata> {
  const latest = await getLatestGetaway()
  const ogImage = latest?.coverImage
    ? urlFor(latest.coverImage).width(1200).height(630).fit('crop').url()
    : undefined

  return {
    title: 'Getaways',
    description: DESCRIPTION,
    alternates: { canonical: '/getaways' },
    openGraph: {
      title: 'Getaways',
      description: DESCRIPTION,
      url: '/getaways',
      locale: 'en_AU',
      siteName: SITE_NAME,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      title: 'Getaways',
      description: DESCRIPTION,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

function coverUrl(post: JournalPost | null, width: number, height: number) {
  if (!post?.coverImage) return null
  return urlFor(post.coverImage).width(width).height(height).fit('crop').url()
}

function GetawaysHero({ post }: { post: JournalPost | null }) {
  const imageUrl = coverUrl(post, 2000, 1200)

  if (!imageUrl) {
    return (
      <section className="bg-[#faf9f6] px-4 py-20 sm:px-6 md:px-8 md:py-28">
        <div className="container mx-auto max-w-6xl">
          <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
            Newcastle Digest
          </p>
          <h1 className="font-sans-main text-6xl font-black uppercase tracking-tighter leading-none text-[#251f18] md:text-8xl">
            Getaways
          </h1>
          <p className="mt-6 max-w-xl font-sans-main text-xl leading-snug text-[#251f18]/65 md:text-2xl">
            {DESCRIPTION}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[520px] overflow-hidden bg-[#18181e] md:min-h-[680px]">
      <Image
        src={imageUrl}
        alt={post?.coverImage?.alt || 'Getaways'}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#18181e] via-[#18181e]/50 to-[#18181e]/20" />
      <div className="relative z-10 flex min-h-[520px] flex-col justify-end px-4 pb-14 sm:px-6 md:min-h-[680px] md:px-8 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff]">
            Newcastle Digest
          </p>
          <h1 className="font-sans-main text-6xl font-black uppercase tracking-tighter leading-none text-white md:text-8xl">
            Getaways
          </h1>
          <p className="mt-5 max-w-xl font-sans-main text-xl leading-snug text-white/80 md:text-2xl">
            {DESCRIPTION}
          </p>
        </div>
      </div>
    </section>
  )
}

function GetawaysFeatured({ post }: { post: JournalPost }) {
  const imageUrl = coverUrl(post, 1400, 1050)

  return (
    <section className="px-4 py-16 sm:px-6 md:px-8 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <p className="mb-8 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
          Latest getaway
        </p>
        <Link
          href={`/getaways/${post.slug}`}
          className="group grid items-center gap-8 md:grid-cols-2 md:gap-12"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-[#f5f4f0]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={post.coverImage?.alt || post.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : null}
          </div>
          <div>
            {post.destination?.title ? (
              <p className="mb-4 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
                {post.destination.title}
              </p>
            ) : null}
            <h2 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.95] text-[#251f18] transition-colors group-hover:text-[#849bff] md:text-6xl">
              {post.title}
            </h2>
            {post.excerpt ? (
              <p className="mt-5 font-sans-main text-lg leading-relaxed text-[#251f18]/65 md:text-xl">
                {post.excerpt}
              </p>
            ) : null}
            <span className="mt-8 inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
              Read getaway →
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}

function GetawaysEmpty() {
  return (
    <section className="px-4 pb-8 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="rounded-[24px] border border-[#251f18]/06 bg-white px-8 py-16 text-center">
          <p className="mb-3 font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
            Coming soon
          </p>
          <p className="font-sans-main text-lg text-[#251f18]/60">
            Places worth escaping to from Newcastle will be published here.
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function GetawaysPage() {
  const [posts, destinations] = await Promise.all([getGetaways(), getDestinationsWithGetaways()])
  const featured = posts[0] ?? null

  return (
    <div className="bg-[#faf9f6]">
      <GetawaysHero post={featured} />
      {featured ? <GetawaysFeatured post={featured} /> : <GetawaysEmpty />}
      {featured ? <GetawaysDirectory posts={posts} destinations={destinations} /> : null}
      <section className="px-4 py-16 sm:px-6 md:px-8 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <NewsletterSubscribeCta
            eyebrow="Newcastle Digest"
            title="Want more places to go?"
            description="Get the best of Newcastle, plus our favourite places to escape to."
          />
        </div>
      </section>
    </div>
  )
}
