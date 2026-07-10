import { TrendingUp } from 'lucide-react';
import { LinkCard } from './LinkCard';

const DIGEST_STUDIO_URL = 'https://digeststudio.com.au';

export function DigestStudioCard() {
  return (
    <LinkCard
      icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
      heading="Grow your business"
      description="Content, SEO, web development and strategy for Newcastle businesses. Built to get you found and keep you growing."
    >
      <a
        href={DIGEST_STUDIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Work with us
      </a>
    </LinkCard>
  );
}
