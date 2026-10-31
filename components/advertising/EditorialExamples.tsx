import Link from 'next/link';

const FEATURES = [
  {
    label: 'Editorial example · Not paid advertising',
    title: 'Local Gem: Sando Man',
    excerpt:
      'The food truck serves Japanese-style sandwiches with a mix of local and global flavours, and one bite took me straight back to Japan.',
    href: '/previous-newsletters/newcastle-digest-14-october',
    linkLabel: 'Read the 14 October newsletter',
    image: '/advertising/sando-man-katsu.jpg',
    imageAlt: 'Chicken katsu sando from Sando Man, held over the grass at Warners Bay',
    imageFirst: true,
    frame: 'object-[center_72%]',
  },
  {
    label: 'Editorial example · Not paid advertising',
    title: 'Best Date Nights in Newcastle: St Lucia, Honeysuckle',
    excerpt:
      'A date night at St Lucia, the Latin-inspired small plates restaurant on Honeysuckle Drive. What we ordered, what to drink and what it costs.',
    href: '/journal/best-date-nights-newcastle-st-lucia',
    linkLabel: 'Read the Journal article',
    image: '/advertising/st-lucia-honeysuckle.jpg',
    imageAlt: 'Inside St Lucia, Honeysuckle, with its striped canopy ceiling and bar',
    imageFirst: false,
    frame: 'object-center',
  },
] as const;

export function EditorialExamples() {
  return (
    <div className="mt-8 border-t border-[#251f18]/15">
      {FEATURES.map((feature) => (
        <article
          key={feature.href}
          className="grid items-center gap-6 border-b border-[#251f18]/15 py-8 md:grid-cols-12 md:gap-10 md:py-10"
        >
          <div className={feature.imageFirst ? 'md:col-span-7' : 'order-2 md:col-span-7 md:col-start-6 md:order-none'}>
            <img
              src={feature.image}
              alt={feature.imageAlt}
              width={1600}
              height={2133}
              className={`aspect-[5/4] w-full object-cover ${feature.frame}`}
            />
          </div>
          <div
            className={
              feature.imageFirst
                ? 'md:col-span-5 md:py-4'
                : 'order-1 md:col-span-5 md:col-start-1 md:row-start-1 md:order-none md:py-4'
            }
          >
            <p className="font-sans-main text-sm font-bold uppercase tracking-[0.08em] text-[#251f18]">{feature.label}</p>
            <h3 className="mt-2 font-sans-main text-3xl font-black tracking-tight text-[#251f18] md:text-4xl">
              <Link
                href={feature.href}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849bff] hover:text-[#849bff]"
              >
                {feature.title}
              </Link>
            </h3>
            <p className="mt-4 font-sans-main text-base leading-relaxed text-[#251f18]/70">{feature.excerpt}</p>
            <Link
              href={feature.href}
              className="mt-5 inline-flex font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849bff] hover:opacity-70"
            >
              {feature.linkLabel} →
            </Link>
          </div>
        </article>
      ))}
      <p className="pt-6 font-sans-main text-base leading-relaxed text-[#251f18]/75">
        These are examples of our editorial style, not paid campaigns. Sponsored content is clearly labelled.
      </p>
    </div>
  );
}
