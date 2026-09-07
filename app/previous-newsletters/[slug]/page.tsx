import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialLink, EditorialLinks } from '@/components/EditorialLinks';
import { NewsletterEditionBody } from '@/components/NewsletterEditionBody';
import { NewsletterSubscribeCta } from '@/components/NewsletterSubscribeCta';
import {
  excerptFromHtml,
  formatEditionDate,
  getPublicEditionBySlug,
  listPublicEditions,
} from '@/lib/beehiiv';
import { OPEN_GRAPH_WEBSITE, SITE_NAME, SITE_URL } from '@/lib/site';

export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const issues = await listPublicEditions();
  return issues.slice(0, 12).map((issue) => ({ slug: issue.slug }));
}

function editionDescription(html: string, seoDescription?: string, previewText?: string, subtitle?: string) {
  if (seoDescription?.trim()) return seoDescription.trim();
  if (previewText?.trim()) return previewText.trim();
  if (subtitle?.trim()) return subtitle.trim();
  const fromHtml = excerptFromHtml(html);
  return fromHtml;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getPublicEditionBySlug(slug);

  if (!edition) {
    return { title: 'Edition not found', robots: { index: false, follow: false } };
  }

  const dateLabel = formatEditionDate(edition.publishedAt);
  const pageTitle = edition.seoTitle || edition.title;
  const description =
    editionDescription(edition.html, edition.seoDescription, edition.previewText, edition.subtitle) ||
    `${edition.title} in Newcastle Digest.`;
  const canonical = `/previous-newsletters/${edition.slug}`;
  const ogImage = edition.thumbnailUrl || undefined;

  if (!pageTitle && dateLabel) {
    return {
      title: { absolute: `${SITE_NAME} | ${dateLabel}` },
      description,
      alternates: { canonical },
      openGraph: {
        ...OPEN_GRAPH_WEBSITE,
        type: 'article',
        title: `${SITE_NAME} | ${dateLabel}`,
        description,
        url: canonical,
        publishedTime: edition.publishedAt || undefined,
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
    };
  }

  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    openGraph: {
      ...OPEN_GRAPH_WEBSITE,
      type: 'article',
      title: pageTitle,
      description,
      url: canonical,
      publishedTime: edition.publishedAt || undefined,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      title: pageTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function NewsletterEditionPage({ params }: PageProps) {
  const { slug } = await params;
  const edition = await getPublicEditionBySlug(slug);

  if (!edition) {
    notFound();
  }

  const publishedLabel = formatEditionDate(edition.publishedAt);
  const description = editionDescription(
    edition.html,
    edition.seoDescription,
    edition.previewText,
    edition.subtitle
  );
  const canonicalUrl = `${SITE_URL}/previous-newsletters/${edition.slug}`;
  const haystack = `${edition.title} ${edition.html}`;
  const mentionsGigs = /gig|live music|concert/i.test(haystack);
  const mentionsMarkets = /market/i.test(haystack);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: edition.title,
    description: description || undefined,
    datePublished: edition.publishedAt || undefined,
    mainEntityOfPage: canonicalUrl,
    image: edition.thumbnailUrl || `${SITE_URL}/nd-logo.png`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/nd-logo.png`,
      },
    },
  };

  return (
    <article className="bg-[#faf9f6] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="px-4 py-14 sm:px-6 md:px-8 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/previous-newsletters"
            className="inline-block font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
          >
            ← Previous Newsletters
          </Link>

          <header className="mt-10 mb-12 text-center md:mt-14 md:mb-16">
            <p className="font-mono-main text-[10px] uppercase tracking-[0.3em] text-[#849bff] mb-4">
              Weekly edition
            </p>
            <h1 className="font-sans-main text-4xl font-black uppercase tracking-tighter leading-[0.95] text-[#251f18] md:text-6xl lg:text-7xl">
              {edition.title}
            </h1>
            {publishedLabel && (
              <time
                dateTime={edition.publishedAt}
                className="mt-6 block font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50"
              >
                {publishedLabel}
              </time>
            )}
            {edition.subtitle && (
              <p className="mt-6 font-sans-main text-lg md:text-xl text-[#251f18]/60 leading-relaxed">
                {edition.subtitle}
              </p>
            )}
          </header>

          {edition.thumbnailUrl && (
            <div className="mb-12 overflow-hidden rounded-[28px] bg-[#f5f4f0] aspect-[16/9]">
              <img
                src={edition.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <NewsletterEditionBody html={edition.html} />

          <EditorialLinks>
            This weekly edition sits alongside the{' '}
            <EditorialLink href="/journal">Newcastle Digest Journal</EditorialLink>
            {mentionsGigs || mentionsMarkets ? '. See ' : '.'}
            {mentionsGigs ? (
              <EditorialLink href="/journal/newcastle-gig-guide">
                this week&apos;s Newcastle Gig Guide
              </EditorialLink>
            ) : null}
            {mentionsGigs && mentionsMarkets ? ' and the ' : null}
            {mentionsMarkets ? (
              <EditorialLink href="/journal/newcastle-markets-guide">
                Newcastle Markets Guide
              </EditorialLink>
            ) : null}
            {mentionsGigs || mentionsMarkets ? '.' : null}
          </EditorialLinks>

          <div className="mt-16 md:mt-20">
            <NewsletterSubscribeCta />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/previous-newsletters"
              className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] hover:opacity-70"
            >
              Back to Previous Newsletters
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
