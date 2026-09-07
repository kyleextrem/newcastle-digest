export type NavLink = {
  name: string;
  href: string;
  external?: boolean;
};

// Add a What's On item here when /whats-on-this-week exists. Do not invent that route yet.
export const NAV_LINKS: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Latest Edition', href: '/previous-newsletters' },
  { name: 'Experiences', href: '/experiences' },
  { name: 'Shop', href: 'https://shop.newcastledigest.com', external: true },
  { name: 'Behind the Digest', href: '/behind' },
  { name: 'Journal', href: '/journal' },
  { name: 'Work With Us', href: '/work' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Contact', href: '/contact' },
];

export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  const path = href.replace(/#.*/, '');
  return pathname === path || pathname.startsWith(`${path}/`);
}
