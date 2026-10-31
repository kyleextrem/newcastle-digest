'use client';

import { useCallback, useState } from 'react';
import { AdvertisingEnquiryForm, AdvertisingEnquiryModal } from '@/components/advertising/EnquiryForm';
import { EditorialExamples } from '@/components/advertising/EditorialExamples';
import { FEATURED_EVENT_URL, type AdvertisingPackage } from '@/lib/advertising';

const SHELL = 'mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8';
const PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-[#849bff] px-6 py-3 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#251f18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]';
const PRIMARY_ON_DARK =
  'inline-flex items-center justify-center rounded-full bg-[#849bff] px-6 py-3 font-mono-main text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-[#251f18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]';

export function WorkWithUs() {
  const [openPackage, setOpenPackage] = useState<AdvertisingPackage | null>(null);
  const closeEnquiry = useCallback(() => setOpenPackage(null), []);

  return (
    <div className="bg-[#faf9f6] text-[#251f18]">
      <header className={`${SHELL} pb-2 pt-8 md:pb-4 md:pt-12`}>
        <p className="font-mono-main text-[11px] uppercase tracking-[0.28em] text-[#849bff]">
          Advertise with Newcastle Digest
        </p>
        <h1 className="mt-4 font-sans-main text-[2.75rem] font-black tracking-tight text-[#251f18] sm:text-6xl lg:text-[4.25rem] lg:leading-[0.92]">
          Newcastle is reading.
          <span className="mt-1 block">Get your business in front of it.</span>
        </h1>
        <p className="mt-5 max-w-2xl font-sans-main text-lg leading-relaxed text-[#251f18]/75 md:text-xl">
          Reach local readers through Newcastle Digest, the weekly newsletter covering what&apos;s happening around town.
        </p>
        <a
          href="#advertising"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#849bff] px-7 py-3.5 font-sans-main text-sm font-bold text-white transition-colors hover:bg-[#251f18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849bff]"
        >
          Explore advertising options
        </a>
        <dl className="mt-8 grid grid-cols-1 border-y border-[#251f18]/15 sm:grid-cols-3">
          <Stat value="7,500+" label="Subscribers" />
          <Stat value="60%" label="Average open rate" />
          <Stat value="Wednesday" label="Weekly publication" />
        </dl>
      </header>

      <section id="examples" className={`${SHELL} scroll-mt-28 pb-12 md:pb-16`} aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="max-w-3xl font-sans-main text-3xl font-black tracking-tight md:text-5xl">
          See how we feature local businesses.
        </h2>
        <EditorialExamples />
      </section>

      <section id="advertising" className={`${SHELL} scroll-mt-28 border-t border-[#251f18]/15 py-12 md:py-16`} aria-labelledby="advertising-heading">
        <h2 id="advertising-heading" className="max-w-3xl font-sans-main text-3xl font-black tracking-tight md:text-5xl">
          Advertise with Newcastle Digest
        </h2>
        <p className="mt-4 max-w-2xl font-sans-main text-lg leading-relaxed text-[#251f18]/70">
          Whether you&apos;re promoting something new or want to share your business with more locals, we have a few ways to help.
        </p>
        <div className="mt-8 border-t border-[#251f18]/15">
          <ProductRow
            name="Newsletter Feature"
            price="$250"
            points={[
              'One sponsored feature in a Wednesday newsletter',
              '80–120 words written by Newcastle Digest',
              'Image, branding and link to the advertiser',
            ]}
            onEnquire={() => setOpenPackage('newsletter-feature')}
          />
          <ProductRow
            name="Sponsored Article"
            price="$400"
            points={[
              'Dedicated 400–600-word Journal article',
              "Published on Newcastle Digest's website",
              'Promoted in one newsletter',
              'Backlink to the advertiser',
            ]}
            onEnquire={() => setOpenPackage('sponsored-article')}
          />
          <ProductRow
            name="Launch Package"
            price="$600"
            points={[
              'Four-week campaign',
              'One sponsored newsletter feature',
              'Supporter recognition across 4–5 editions',
              'One sponsored Journal article',
              'Priority scheduling',
            ]}
            onEnquire={() => setOpenPackage('launch-package')}
          />
        </div>
        <p className="mt-8 font-sans-main text-base leading-relaxed text-[#251f18]/75">
          Promoting an event?{' '}
          <a href={FEATURED_EVENT_URL} className="font-bold text-[#251f18] underline decoration-[#849bff] underline-offset-4">
            Featured Event listings are $49.
          </a>{' '}
          The listing is still reviewed, and featured does not guarantee it will be published.
        </p>
        <p className="mt-4 font-sans-main text-base leading-relaxed text-[#251f18]/75">
          Planning something larger or unusual?{' '}
          <button
            type="button"
            onClick={() => setOpenPackage('campaigns')}
            className="font-bold text-[#251f18] underline decoration-[#849bff] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849bff]"
          >
            Enquire about a custom campaign.
          </button>
        </p>
      </section>

      <section id="partnerships" className="scroll-mt-28 bg-[#251f18] text-[#faf9f6]" aria-labelledby="partnerships-heading">
        <div className={`${SHELL} py-12 md:py-16`}>
          <h2 id="partnerships-heading" className="max-w-3xl font-sans-main text-3xl font-black tracking-tight md:text-5xl">
            Become a Newcastle Digest partner
          </h2>
          <p className="mt-4 max-w-2xl font-sans-main text-lg leading-relaxed text-white/70">
            Keep your business in front of local readers with regular advertising or exclusive sponsorship.
          </p>
          <div className="mt-8 border-t border-white/15">
            <ProductRow
              tone="dark"
              name="Category Sponsorship"
              price="$300"
              priceSuffix="/month"
              summary="Exclusive sponsorship of one content category for a calendar month: Food, Markets, Events or Gigs."
              points={[
                'Business logo and a one-line description on relevant Journal articles',
                'Sponsorship recognition in the corresponding weekly newsletter section',
                'Category exclusivity during the sponsorship period',
              ]}
              onEnquire={() => setOpenPackage('category-sponsorship')}
            />
            <ProductRow
              tone="dark"
              name="Monthly Partner"
              price="$500"
              priceSuffix="/month"
              points={[
                'One dedicated newsletter feature in an edition chosen by the advertiser',
                'Supporter recognition in every edition during that month',
                'Priority scheduling',
              ]}
              onEnquire={() => setOpenPackage('monthly-partner')}
            />
          </div>
          <div className="mt-2 flex flex-col gap-5 border-t border-white/15 pt-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="font-sans-main text-2xl font-black tracking-tight">Quarterly and annual partnerships</h3>
              <p className="mt-2 font-sans-main text-base leading-relaxed text-white/75">
                Longer arrangements are available, with pricing on enquiry.
              </p>
            </div>
            <button type="button" onClick={() => setOpenPackage('partnership')} className={`${PRIMARY_ON_DARK} w-full shrink-0 md:w-auto`}>
              Enquire about a longer partnership
            </button>
          </div>
        </div>
      </section>

      <section id="enquire" className={`${SHELL} scroll-mt-28 py-12 md:py-16`} aria-labelledby="enquire-heading">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <h2 id="enquire-heading" className="font-sans-main text-3xl font-black tracking-tight md:text-5xl">
              Have something to promote?
            </h2>
            <p className="mt-4 font-sans-main text-lg leading-relaxed text-[#251f18]/70">
              Tell us what you&apos;re promoting. We&apos;ll reply by email with a placement, a price and availability. There is no call to book, and nothing to pay to enquire.
            </p>
          </div>
          <AdvertisingEnquiryForm source="work" initialPackage="unsure" idPrefix="work-inline" />
        </div>
      </section>

      <AdvertisingEnquiryModal
        open={openPackage !== null}
        source="work"
        packageId={openPackage ?? 'unsure'}
        onClose={closeEnquiry}
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#251f18]/15 py-3 last:border-b-0 sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:border-b-0 sm:px-6 sm:py-4 sm:first:pl-0 sm:[&:not(:first-child)]:border-l">
      <dd className="font-sans-main text-2xl font-black tracking-tight md:text-3xl">{value}</dd>
      <dt className="text-right font-sans-main text-sm leading-snug text-[#251f18]/65 sm:text-left">{label}</dt>
    </div>
  );
}

function ProductRow({
  name,
  price,
  priceSuffix,
  summary,
  points,
  onEnquire,
  tone = 'light',
}: {
  name: string;
  price: string;
  priceSuffix?: string;
  summary?: string;
  points: readonly string[];
  onEnquire: () => void;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <article
      className={`grid gap-5 border-b py-8 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-start md:gap-10 ${dark ? 'border-white/15' : 'border-[#251f18]/15'}`}
    >
      <p className={`font-sans-main text-4xl font-black tracking-tight md:text-5xl ${dark ? 'text-white' : 'text-[#251f18]'}`}>
        {price}
        {priceSuffix ? <span className={`text-lg ${dark ? 'text-white/55' : 'text-[#251f18]/55'}`}>{priceSuffix}</span> : null}
      </p>
      <div>
        <h3 className={`font-sans-main text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-[#251f18]'}`}>{name}</h3>
        {summary ? (
          <p className={`mt-2 font-sans-main text-base leading-relaxed ${dark ? 'text-white/75' : 'text-[#251f18]/80'}`}>{summary}</p>
        ) : null}
        <ul className={`mt-3 space-y-1.5 font-sans-main text-base leading-relaxed ${dark ? 'text-white/75' : 'text-[#251f18]/80'}`}>
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#849bff]" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onEnquire}
        className={`${dark ? PRIMARY_ON_DARK : PRIMARY} w-full md:mt-1 md:w-auto md:self-center`}
        aria-label={`Enquire about ${name}`}
      >
        Enquire
      </button>
    </article>
  );
}
