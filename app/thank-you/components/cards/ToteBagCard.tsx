import { ShoppingBag } from 'lucide-react';
import { LinkCard } from './LinkCard';

const TOTE_URL = 'https://shop.newcastledigest.com/products/newcastle-digest-market-tote-bag';

export function ToteBagCard() {
  return (
    <LinkCard
      icon={<ShoppingBag className="h-4 w-4" strokeWidth={2} />}
      heading="Market Tote Bag"
      description="Carry Newcastle with you. $25."
    >
      <a
        href={TOTE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Shop now
      </a>
    </LinkCard>
  );
}
