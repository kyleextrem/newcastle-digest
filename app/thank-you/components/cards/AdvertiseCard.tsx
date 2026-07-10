import { Megaphone } from 'lucide-react';
import { LinkCard } from './LinkCard';

const ADVERTISE_URL = 'https://tally.so/r/wkK8xj';

export function AdvertiseCard() {
  return (
    <LinkCard
      icon={<Megaphone className="h-4 w-4" strokeWidth={2} />}
      heading="Reach 7,300+ Newcastle locals"
      description="Sponsor the newsletter, promote an event, or run a shoutout to our engaged local audience."
    >
      <a
        href={ADVERTISE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Get in touch
      </a>
    </LinkCard>
  );
}
