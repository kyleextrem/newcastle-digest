import { Star } from 'lucide-react';
import { LinkCard } from './LinkCard';

const TESTIMO_URL = 'https://testimo.com.au';

export function TestimoCard() {
  return (
    <LinkCard
      icon={<Star className="h-4 w-4" strokeWidth={2} />}
      heading="Turn customers into reviews"
      description="Collect more Google reviews and referrals automatically. Set up in minutes."
    >
      <a
        href={TESTIMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Try Testimo
      </a>
    </LinkCard>
  );
}
