import type { ReactNode } from 'react';
import Link from 'next/link';

const LINK_CLASS =
  'text-[#849bff] underline underline-offset-2 transition-opacity hover:opacity-70';

export function EditorialLinks({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-12 max-w-2xl font-sans-main text-lg leading-relaxed text-[#251f18]/70">
      {children}
    </p>
  );
}

export function EditorialLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={LINK_CLASS}>
      {children}
    </Link>
  );
}
