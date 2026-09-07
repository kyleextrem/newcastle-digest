import { Instagram } from 'lucide-react';
import { LinkCard } from './LinkCard';

const INSTAGRAM_URL = 'https://www.instagram.com/newcastledigest/';

export function InstagramCard() {
  return (
    <LinkCard
      icon={<Instagram className="h-4 w-4" strokeWidth={2} />}
      heading="Instagram"
      description="Follow along between editions"
    >
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Follow
      </a>
    </LinkCard>
  );
}
