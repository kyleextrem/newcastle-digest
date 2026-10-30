import type { ReactNode } from 'react';
import Link from 'next/link';
import { Briefcase, CalendarDays, Instagram, Megaphone, Music, ShoppingBag, Star, Store, TrendingUp } from 'lucide-react';
import type { EndScreenAudience } from '@/lib/thank-you-profile';
import { LinkCard } from './cards/LinkCard';

type EndCard = {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: ReactNode;
  external: boolean;
};

const LINK_CLASS =
  'inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]';

const BUSINESS_CARDS: EndCard[] = [
  {
    title: 'Reach Newcastle locals',
    description: 'Advertise in Newcastle Digest through newsletter sponsorships, event promotions and other placements.',
    href: 'https://tally.so/r/wkK8xj',
    label: 'Get in touch',
    icon: <Megaphone className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
  {
    title: 'Post a local job',
    description: 'Free listings available, with paid featured options.',
    href: 'https://jobs.newcastledigest.com/jobs/submit',
    label: 'Post a job',
    icon: <Briefcase className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
  {
    title: 'Digest Studio',
    description: 'Websites, content and SEO for local businesses.',
    href: 'https://digeststudio.com.au',
    label: 'Work with us',
    icon: <TrendingUp className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
  {
    title: 'Testimo',
    description: 'Make it easier to request and manage customer reviews.',
    href: 'https://testimo.com.au',
    label: 'Try Testimo',
    icon: <Star className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
];

const READER_CARDS: EndCard[] = [
  {
    title: "What's on in Newcastle",
    description: 'Events, openings and things happening around town.',
    href: '/events',
    label: 'Explore',
    icon: <CalendarDays className="h-4 w-4" strokeWidth={2} />,
    external: false,
  },
  {
    title: 'Newcastle Gig Guide',
    description: "Who's playing where, every week.",
    href: '/journal/newcastle-gig-guide',
    label: 'See the guide',
    icon: <Music className="h-4 w-4" strokeWidth={2} />,
    external: false,
  },
  {
    title: 'Newcastle Markets Guide',
    description: 'Makers, and where to go this weekend.',
    href: '/journal/newcastle-markets-guide',
    label: 'See the guide',
    icon: <Store className="h-4 w-4" strokeWidth={2} />,
    external: false,
  },
  {
    title: 'Newcastle Digest Market Tote',
    description: 'Carry Newcastle with you. $25.',
    href: 'https://shop.newcastledigest.com/products/newcastle-digest-market-tote-bag',
    label: 'Shop now',
    icon: <ShoppingBag className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
  {
    title: 'Local jobs',
    description: 'Hiring or job hunting in Newcastle?',
    href: 'https://jobs.newcastledigest.com',
    label: 'Browse jobs',
    icon: <Briefcase className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
  {
    title: 'Instagram',
    description: 'Follow along between editions.',
    href: 'https://instagram.com/newcastledigest',
    label: 'Follow',
    icon: <Instagram className="h-4 w-4" strokeWidth={2} />,
    external: true,
  },
];

function cardsFor(audience: EndScreenAudience): { heading: string; cards: EndCard[] } {
  switch (audience) {
    case 'business':
      return {
        heading: "You're in. Here's what we do for local businesses.",
        cards: BUSINESS_CARDS,
      };
    case 'reader':
      return {
        heading: "You're in. Here's where to start.",
        cards: READER_CARDS,
      };
    default: {
      const unreachable: never = audience;
      return unreachable;
    }
  }
}

function CardLink({ card }: { card: EndCard }) {
  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {card.label}
      </a>
    );
  }
  return (
    <Link href={card.href} className={LINK_CLASS}>
      {card.label}
    </Link>
  );
}

export function StepEndScreen({ audience }: { audience: EndScreenAudience }) {
  const { heading, cards } = cardsFor(audience);

  return (
    <div className="px-4 py-10 sm:px-6 md:py-16">
      <h2 className="mx-auto mb-8 max-w-2xl text-center font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] sm:text-4xl">
        {heading}
      </h2>

      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-px border border-[#251f18]/08 bg-[#251f18]/08">
        {cards.map((card) => (
          <LinkCard key={card.title} icon={card.icon} heading={card.title} description={card.description}>
            <CardLink card={card} />
          </LinkCard>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
          NEWCASTLE DIGEST
        </p>
        <p className="mt-3 font-sans-main text-base text-[#251f18]/70">See you Wednesday.</p>
      </div>
    </div>
  );
}
