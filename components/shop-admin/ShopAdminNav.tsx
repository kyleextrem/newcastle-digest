'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/shop/admin', label: 'Products', match: (path: string) => path === '/shop/admin' || path.startsWith('/shop/admin/products') },
  { href: '/shop/admin/orders', label: 'Orders', match: (path: string) => path.startsWith('/shop/admin/orders') },
];

export function ShopAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-2 print:hidden">
      {LINKS.map((link) => {
        const selected = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 font-mono-main text-[10px] uppercase tracking-widest ${
              selected ? 'bg-[#849bff] text-white' : 'bg-white text-[#251f18]'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
