import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { LinkCard } from './LinkCard';

export function ToteBagCard() {
  return (
    <LinkCard
      icon={<ShoppingBag className="h-4 w-4" strokeWidth={2} />}
      heading="Market Tote Bag"
      description="Carry Newcastle with you. $25."
    >
      <Link
        href="/shop/newcastle-digest-market-tote-bag"
        className="inline-flex font-mono-main text-[9px] uppercase tracking-widest text-[#849bff] transition-colors hover:text-[#6a7be6]"
      >
        Shop now
      </Link>
    </LinkCard>
  );
}
