'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Employees' },
  { href: '/projects', label: 'Projects' },
  { href: '/time-entries', label: 'Time entries' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((link) => {
        const active =
          link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'rounded bg-gray-900 px-3 py-1.5 font-medium text-white'
                : 'rounded px-3 py-1.5 text-gray-600 hover:bg-gray-100'
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
